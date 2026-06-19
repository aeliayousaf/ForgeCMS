import { BadRequestException, Injectable, Logger } from "@nestjs/common";
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
import {
  BUILD_SITE_PLAN_SYSTEM,
  SYSTEM_BLOCKS,
  buildSitePagePrompt,
  buildSitePlanPrompt,
  websitePrompt,
} from "./prompts";
import { sanitizeDocument } from "../common/sanitize";
import { z } from "zod";

const buildSitePlanSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().optional(),
  themeKey: z.string().optional(),
  menu: z.array(z.object({ label: z.string().min(1), url: z.string().min(1) })).min(1),
  pages: z
    .array(
      z.object({
        title: z.string(),
        slug: z.string(),
        summary: z.string().min(1),
      }),
    )
    .min(1)
    .max(5),
});

class ProviderHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ProviderHttpError";
  }
}

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
    const resolved = this.resolveAiConfig(cfg);
    return {
      configured: Boolean(cfg.apiKey?.trim()),
      model: resolved.model,
      baseUrl: resolved.baseUrl,
    };
  }

  /** OpenRouter requires provider/model (e.g. openai/gpt-4o-mini). */
  private resolveAiConfig(cfg: { apiKey: string; baseUrl: string; model: string }) {
    const baseUrl = cfg.baseUrl.replace(/\/$/, "");
    let model = cfg.model.trim() || "gpt-4o-mini";
    if (/openrouter\.ai/i.test(baseUrl) && !model.includes("/")) {
      model = `openai/${model}`;
    }
    const appUrl = process.env.APP_URL?.split(",")[0]?.trim() ?? "https://getforgecms.com";
    return { apiKey: cfg.apiKey, baseUrl, model, appUrl };
  }

  private async requestChat(
    cfg: ReturnType<AiService["resolveAiConfig"]>,
    system: string,
    user: string,
    json: boolean,
    maxTokens: number,
  ): Promise<string> {
    const url = `${cfg.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300_000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
          "HTTP-Referer": cfg.appUrl,
          "X-Title": "ForgeCMS",
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
          ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      const rawBody = await res.text();
      if (!res.ok) {
        let detail = rawBody.slice(0, 300);
        try {
          const parsed = JSON.parse(rawBody) as { error?: { message?: string } };
          detail = parsed.error?.message ?? detail;
        } catch {
          /* keep raw snippet */
        }
        throw new ProviderHttpError(detail, res.status);
      }

      let parsed: { choices?: { message?: { content?: string } }[] };
      try {
        parsed = JSON.parse(rawBody) as typeof parsed;
      } catch {
        throw new Error(`Invalid JSON from AI provider (${rawBody.slice(0, 120)}…)`);
      }

      const content = parsed.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) {
        throw new BadRequestException("AI returned an empty response. Try again or use a different model.");
      }
      return content;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("AI request timed out after 5 minutes");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection() {
    const cfg = await this.settings.getAiConfig();
    if (!cfg.apiKey?.trim()) {
      throw new BadRequestException("No AI API key configured.");
    }
    const resolved = this.resolveAiConfig(cfg);
    const started = Date.now();
    const reply = await this.chat("You are a test assistant.", 'Reply with exactly the word "OK".', false, 32);
    return {
      ok: true,
      model: resolved.model,
      baseUrl: resolved.baseUrl,
      reply: reply.slice(0, 80),
      latencyMs: Date.now() - started,
    };
  }

  private isRetryableProviderError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /premature close|ECONNRESET|socket hang up|fetch failed|ETIMEDOUT|502|503/i.test(msg);
  }

  private async chat(
    system: string,
    user: string,
    json: boolean,
    maxTokens = json ? 4_096 : 2_048,
  ): Promise<string> {
    const cfg = await this.settings.getAiConfig();
    if (!cfg.apiKey?.trim()) {
      throw new BadRequestException(
        "No AI API key configured. Add one in Settings to use the AI Assistant.",
      );
    }
    const resolved = this.resolveAiConfig(cfg);
    const maxAttempts = 4;
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.requestChat(resolved, system, user, json, maxTokens);
      } catch (err) {
        lastErr = err;
        if (err instanceof BadRequestException) throw err;
        if (attempt < maxAttempts && this.isRetryableProviderError(err)) {
          this.logger.warn(`AI chat attempt ${attempt}/${maxAttempts} failed (${resolved.model}), retrying…`);
          await new Promise((r) => setTimeout(r, 3_000 * attempt));
          continue;
        }
        break;
      }
    }

    const message = this.formatProviderError(lastErr);
    this.logger.error(`AI chat error: ${message}`);
    throw new BadRequestException(message);
  }

  private formatProviderError(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    const status = err instanceof ProviderHttpError ? err.status : undefined;
    const isCloudflareBlock =
      status === 403 ||
      /cloudflare|challenge-platform|Enable JavaScript and cookies/i.test(raw);

    if (isCloudflareBlock) {
      return (
        "OpenAI blocked requests from this server (Cloudflare). Datacenter/VPS IPs often cannot reach api.openai.com directly. " +
        "Use OpenRouter instead: Base URL https://openrouter.ai/api/v1, your OpenRouter API key, and model openai/gpt-4o-mini."
      );
    }
    if (status === 401) return "Invalid API key. Check your key in Settings → AI Integration.";
    if (status === 429) return "AI rate limit exceeded. Wait a moment or switch provider/model.";
    if (status === 402) return "OpenRouter credits exhausted. Add credits at openrouter.ai/settings/credits.";
    if (status !== undefined) {
      const brief = raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
      return `AI provider error (${status}): ${brief}`;
    }
    if (/premature close|ECONNRESET|socket hang up|fetch failed|ETIMEDOUT|aborted/i.test(raw)) {
      return (
        "Connection to the AI provider closed early. Use Settings → Test connection first. " +
        "If that fails: confirm Base URL https://openrouter.ai/api/v1, model openai/gpt-4o-mini, and OpenRouter credits."
      );
    }
    const brief = raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
    return brief;
  }

  private rethrowStep(step: string, err: unknown): never {
    if (err instanceof BadRequestException) {
      throw new BadRequestException(`${step}: ${err.message}`);
    }
    throw err;
  }

  private async record(userId: string | undefined, kind: string, prompt: string, response: string) {
    try {
      await this.prisma.aIHistory.create({
        data: { userId: userId ?? null, kind, prompt, response: response.slice(0, 60000) },
      });
    } catch (err) {
      this.logger.warn(`Failed to record AI history: ${String(err)}`);
    }
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

  /** AI models often omit block ids; assign them before Zod validation. */
  private coerceBlockNode(raw: unknown): BlockNode {
    const b = raw as Record<string, unknown>;
    const children = Array.isArray(b.children)
      ? (b.children as unknown[]).map((c) => this.coerceBlockNode(c))
      : undefined;
    return {
      id: typeof b.id === "string" && b.id.length > 0 ? b.id : randomUUID(),
      type: b.type as BlockNode["type"],
      props: (b.props as Record<string, unknown>) ?? {},
      styles: b.styles as BlockNode["styles"],
      children,
    };
  }

  private coercePageDocument(raw: unknown): PageDocument {
    const doc = raw as Record<string, unknown>;
    const blocks = Array.isArray(doc.blocks)
      ? (doc.blocks as unknown[]).map((b) => this.coerceBlockNode(b))
      : [];
    return pageDocumentSchema.parse({ version: 1, blocks });
  }

  private parseAiJson(raw: string): unknown {
    try {
      return JSON.parse(this.stripFence(raw));
    } catch {
      throw new BadRequestException("AI returned invalid JSON. Try again.");
    }
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
    this.logger.log("buildSite: planning site structure…");
    let planRaw: string;
    try {
      planRaw = await this.chat(
        BUILD_SITE_PLAN_SYSTEM,
        buildSitePlanPrompt(input.prompt),
        true,
        2_048,
      );
    } catch (err) {
      this.rethrowStep("Site planning failed", err);
    }
    await this.record(userId, "build-site-plan", input.prompt, planRaw!);

    let plan: z.infer<typeof buildSitePlanSchema>;
    try {
      plan = buildSitePlanSchema.parse(this.parseAiJson(planRaw!));
    } catch (err) {
      this.logger.warn(`buildSite plan parse error: ${String(err)}`);
      throw new BadRequestException("AI could not plan the site structure. Try again.");
    }

    const pagesWithDocs: { title: string; slug: string; document: PageDocument }[] = [];
    for (const page of plan.pages) {
      this.logger.log(`buildSite: generating page "${page.title}"…`);
      try {
        const pageRaw = await this.chat(
          SYSTEM_BLOCKS,
          buildSitePagePrompt({
            userPrompt: input.prompt,
            siteName: plan.siteName,
            title: page.title,
            slug: page.slug,
            summary: page.summary,
          }),
          true,
          4_096,
        );
        await this.record(userId, `build-site-page:${page.slug}`, page.summary, pageRaw);
        pagesWithDocs.push({
          title: page.title,
          slug: page.slug,
          document: this.coercePageDocument(this.parseAiJson(pageRaw)),
        });
      } catch (err) {
        this.rethrowStep(`Page "${page.title}" generation failed`, err);
      }
    }

    const data = {
      siteName: plan.siteName,
      siteDescription: plan.siteDescription,
      themeKey: plan.themeKey,
      menu: plan.menu,
      pages: pagesWithDocs,
    };

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
      let page;
      try {
        page = await this.prisma.page.create({
          data: {
            title: p.title,
            slug,
            status: "draft",
            isHomepage: slug === "home",
            versions: { create: { version: 1, document: doc as object, authorId: userId } },
          },
        });
      } catch (err) {
        this.logger.error(`Failed to create page ${p.title}: ${String(err)}`);
        throw new BadRequestException(`Could not save page "${p.title}". ${String(err)}`);
      }

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
      const json = this.parseAiJson(raw) as Record<string, unknown>;
      if (Array.isArray(json.pages)) {
        json.pages = (json.pages as Record<string, unknown>[]).map((p) => ({
          ...p,
          document: this.coercePageDocument(p.document),
        }));
      }
      data = schema.parse(json);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
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
      try {
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
      } catch (err) {
        this.logger.error(`Failed to create page ${p.title}: ${String(err)}`);
        throw new BadRequestException(`Could not save page "${p.title}". ${String(err)}`);
      }
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
