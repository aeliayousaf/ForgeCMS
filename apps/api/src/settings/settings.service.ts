import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SETTINGS_KEYS } from "@forgecms/shared";
import { decryptSecret, encryptSecret } from "../common/crypto.util";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const row = await this.prisma.settings.findUnique({ where: { key } });
    if (!row) return null;
    return row.encrypted ? decryptSecret(row.value) : row.value;
  }

  async set(key: string, value: string, encrypted = false) {
    const stored = encrypted ? encryptSecret(value) : value;
    await this.prisma.settings.upsert({
      where: { key },
      update: { value: stored, encrypted },
      create: { key, value: stored, encrypted },
    });
    return { ok: true };
  }

  async isInstalled(): Promise<boolean> {
    const flag = await this.prisma.settings.findUnique({
      where: { key: SETTINGS_KEYS.installComplete },
    });
    if (flag?.value !== "true") return false;
    const adminCount = await this.prisma.user.count();
    return adminCount > 0;
  }

  // Non-sensitive settings safe to expose to the public site / web app.
  async getPublic() {
    const keys = [
      SETTINGS_KEYS.siteName,
      SETTINGS_KEYS.siteDescription,
      SETTINGS_KEYS.activeThemeKey,
    ];
    const rows = await this.prisma.settings.findMany({ where: { key: { in: keys } } });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      siteName: map[SETTINGS_KEYS.siteName] ?? "ForgeCMS",
      siteDescription: map[SETTINGS_KEYS.siteDescription] ?? "",
      activeThemeKey: map[SETTINGS_KEYS.activeThemeKey] ?? "business",
    };
  }

  async getAiConfig() {
    return {
      apiKey: (await this.get(SETTINGS_KEYS.aiApiKey)) ?? process.env.OPENAI_API_KEY ?? "",
      baseUrl:
        (await this.get(SETTINGS_KEYS.aiBaseUrl)) ??
        process.env.OPENAI_BASE_URL ??
        "https://api.openai.com/v1",
      model: (await this.get(SETTINGS_KEYS.aiModel)) ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    };
  }
}
