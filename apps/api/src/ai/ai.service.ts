import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import {
  pageDocumentSchema,
  type AiCreateWebsiteInput,
  type PageDocument,
} from "@forgecms/shared";
import { SYSTEM_BLOCKS, websitePrompt } from "./prompts";
import { sanitizeDocument } from "../common/sanitize";
import { z } from "zod";

@Injectable()
export class AiService {
  private readonly logger = new Logger("AI");

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

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

  private ensureIds(doc: PageDocument): PageDocument {
    return sanitizeDocument({
      version: 1,
      blocks: doc.blocks.map((b) => ({ ...b, id: b.id || randomUUID() })),
    });
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

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
    let n = 1;
    while (await this.prisma.page.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
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
