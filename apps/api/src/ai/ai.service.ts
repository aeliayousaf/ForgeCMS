import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { MenusService } from "../menus/menus.module";
import { PagesService } from "../pages/pages.service";
import { ThemesService } from "../themes/themes.service";
import {
  pageDocumentSchema,
  SETTINGS_KEYS,
  THEME_KEYS,
  type AiBuildSiteInput,
  type AiCreateWebsiteInput,
  type BlockNode,
  type PageDocument,
} from "@forgecms/shared";
import { BUILD_SITE_SYSTEM, SYSTEM_BLOCKS, buildSitePrompt, websitePrompt } from "./prompts";
import { sanitizeDocument } from "../common/sanitize";
import { z } from "zod";

const buildSiteResponseSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().optional(),
  themeKey: z.string().optional(),
  menu: z.array(z.object({ label: z.string().min(1), url: z.string().min(1) })).min(1),
  pages: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      document: pageDocumentSchema,
    }),
  ).min(1),
});

@Injectable()
export class AiService {
  private readonly logger = new Logger("AI");

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly menus: MenusService,
    private readonly pages: PagesService,
    private readonly themes: ThemesService,
  ) {}

  async getStatus() {
    const cfg = await this.settings.getAiConfig();
    return {
      configured: Boolean(cfg.apiKey?.trim()),
      model: cfg.model,
      baseUrl: cfg.baseUrl,
    };
  }

  private async client() {
    const cfg = await this.settings.getAiConfig();
    if (!cfg.apiKey) {
      throw new BadRequestException(
        "No AI API key configured. Add one in Settings to use the AI Assistant.",
      );
    }
    return {
      openai: new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl }),
      model: cfg.model,
    };
  }

  private async chat(system: string, user: string, json: boolean): Promise<string> {
    const { openai, model } = await this.client();
    const res = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: json ? { type: "json_object" } : undefined,
    });
    return res.choices[0]?.message?.content ?? "";
  }

  private async record(userId: string | undefined, kind: string, prompt: string, response: string) {
    await this.prisma.aIHistory.create({
      data: { userId: userId ?? null, kind, prompt, response: response.slice(0, 60000) },
    });
  }

  async generate(
    userId: string | undefined,
    kind: string,
    prompt: string,
    context?: string,
  ) {
    const wantsJson = kind === "page";
    const system = wantsJson
      ? SYSTEM_BLOCKS
      : "You are a helpful website copywriting assistant. Be concise and high quality.";
    const user = context ? `${prompt}\n\nContext:\n${context}` : prompt;
    const raw = await this.chat(system, user, wantsJson);
    await this.record(userId, kind, user, raw);

    if (kind === "page") {
      const doc = this.safeParseDocument(raw);
      return { document: doc };
    }
    return { text: raw };
  }

  private safeParseDocument(raw: string): PageDocument {
    try {
      const parsed = pageDocumentSchema.parse(JSON.parse(this.stripFence(raw)));
      return this.ensureIds(parsed);
    } catch (err) {
      this.logger.warn(`AI returned invalid document: ${String(err)}`);
      throw new BadRequestException("AI returned content that could not be parsed. Try again.");
    }
  }

  private stripFence(s: string): string {
    return s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }

  private ensureBlockIds(block: BlockNode): BlockNode {
    return {
      ...block,
      id: block.id || randomUUID(),
      children: block.children?.map((c) => this.ensureBlockIds(c)),
    };
  }

  private ensureIds(doc: PageDocument): PageDocument {
    return sanitizeDocument({
      version: 1,
      blocks: doc.blocks.map((b) => this.ensureBlockIds(b)),
    });
  }

  async buildSite(userId: string | undefined, input: AiBuildSiteInput) {
    const raw = await this.chat(BUILD_SITE_SYSTEM, buildSitePrompt(input.prompt), true);
    await this.record(userId, "build-site", input.prompt, raw);

    let data: z.infer<typeof buildSiteResponseSchema>;
    try {
      data = buildSiteResponseSchema.parse(JSON.parse(this.stripFence(raw)));
    } catch (err) {
      this.logger.warn(`buildSite parse error: ${String(err)}`);
      throw new BadRequestException("AI generation failed to produce a valid site. Try again.");
    }

    await this.settings.set(SETTINGS_KEYS.siteName, data.siteName);
    if (data.siteDescription) {
      await this.settings.set(SETTINGS_KEYS.siteDescription, data.siteDescription);
    }

    const themeKey = this.resolveThemeKey(data.themeKey);
    if (themeKey) {
      await this.themes.activate(themeKey);
      await this.settings.set(SETTINGS_KEYS.activeThemeKey, themeKey);
    }

    const created: { id: string; title: string; slug: string; published: boolean }[] = [];
    const hasHome = data.pages.some((p) => p.slug === "home" || p.slug === "");
    if (hasHome) {
      await this.prisma.page.updateMany({ data: { isHomepage: false } });
    }

    for (const p of data.pages) {
      const slug = await this.uniqueSlug(p.slug === "home" ? "home" : p.slug);
      const doc = this.ensureIds(p.document);
      const page = await this.prisma.page.create({
        data: {
          title: p.title,
          slug,
          status: "draft",
          isHomepage: slug === "home",
          versions: { create: { version: 1, document: doc as object, authorId: userId } },
        },
      });

      let published = false;
      if (input.publish) {
        await this.pages.publish(page.id);
        published = true;
      }

      created.push({ id: page.id, title: page.title, slug: page.slug, published });
    }

    const menuItems = this.normalizeMenuItems(data.menu, created);
    await this.menus.replaceItems("primary", menuItems);

    return {
      siteName: data.siteName,
      siteDescription: data.siteDescription ?? "",
      themeKey: themeKey ?? null,
      menu: menuItems,
      pages: created,
      published: input.publish,
    };
  }

  async createWebsite(userId: string | undefined, input: AiCreateWebsiteInput) {
    const raw = await this.chat(SYSTEM_BLOCKS, websitePrompt(input), true);
    await this.record(userId, "create-website", JSON.stringify(input), raw);

    const schema = z.object({
      pages: z.array(
        z.object({
          title: z.string(),
          slug: z.string(),
          document: pageDocumentSchema,
        }),
      ),
    });

    let data: z.infer<typeof schema>;
    try {
      data = schema.parse(JSON.parse(this.stripFence(raw)));
    } catch (err) {
      this.logger.warn(`createWebsite parse error: ${String(err)}`);
      throw new BadRequestException("AI generation failed to produce valid pages. Try again.");
    }

    const created: { id: string; title: string; slug: string }[] = [];
    const hasHome = data.pages.some((p) => p.slug === "home");
    if (hasHome) {
      await this.prisma.page.updateMany({ data: { isHomepage: false } });
    }

    for (const p of data.pages) {
      const slug = await this.uniqueSlug(p.slug);
      const doc = this.ensureIds(p.document);
      const page = await this.prisma.page.create({
        data: {
          title: p.title,
          slug,
          status: "draft",
          isHomepage: slug === "home",
          versions: { create: { version: 1, document: doc as object, authorId: userId } },
        },
      });
      created.push({ id: page.id, title: page.title, slug: page.slug });
    }
    return { pages: created };
  }

  private resolveThemeKey(key?: string): string | null {
    if (!key) return null;
    const normalized = key.toLowerCase().trim();
    return THEME_KEYS.includes(normalized as (typeof THEME_KEYS)[number]) ? normalized : "business";
  }

  private normalizeMenuItems(
    menu: { label: string; url: string }[],
    pages: { slug: string }[],
  ): { label: string; url: string }[] {
    const slugs = new Set(pages.map((p) => p.slug));
    return menu.map((item) => {
      let url = item.url.trim();
      if (url === "/home" || url === "home") url = "/";
      if (!url.startsWith("/")) url = `/${url}`;
      const slugFromUrl = url === "/" ? "home" : url.replace(/^\//, "");
      if (slugFromUrl && !slugs.has(slugFromUrl) && url !== "/") {
        // Keep custom URLs (external links) as-is.
        const match = pages.find((p) => url === `/${p.slug}`);
        if (!match && !url.startsWith("http")) {
          url = `/${slugFromUrl}`;
        }
      }
      return { label: item.label, url };
    });
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
    const original = slug;
    let n = 1;
    while (await this.prisma.page.findUnique({ where: { slug } })) slug = `${original}-${n++}`;
    return slug;
  }

  history(userId?: string) {
    return this.prisma.aIHistory.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, kind: true, prompt: true, createdAt: true },
    });
  }
}
