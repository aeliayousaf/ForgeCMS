import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { SettingsService } from "../settings/settings.service";
import {
  activateTheme,
  seedDefaultMenu,
  seedPermissionsAndRoles,
  seedSampleContent,
  seedThemes,
} from "@forgecms/database";
import { SETTINGS_KEYS, type SetupCompleteInput } from "@forgecms/shared";

@Injectable()
export class SetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly settings: SettingsService,
  ) {}

  async status() {
    return { installed: await this.settings.isInstalled() };
  }

  private async assertNotInstalled() {
    if (await this.settings.isInstalled()) {
      throw new BadRequestException("ForgeCMS is already installed");
    }
  }

  async testDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, message: "Database connection successful" };
    } catch (err) {
      throw new BadRequestException(`Database connection failed: ${String(err)}`);
    }
  }

  async listThemes() {
    // Ensure themes exist even before the final commit so step 4 can show them.
    await seedThemes(this.prisma);
    return this.prisma.theme.findMany({
      select: { id: true, key: true, name: true, category: true, preview: true },
      orderBy: { name: "asc" },
    });
  }

  // Single orchestration that finalizes the install. Migrations are applied by
  // the container entrypoint (prisma migrate deploy) before the API boots.
  async complete(input: SetupCompleteInput) {
    await this.assertNotInstalled();

    await seedPermissionsAndRoles(this.prisma);
    await seedThemes(this.prisma);

    const adminRole = await this.prisma.role.findUnique({ where: { name: "admin" } });
    if (!adminRole) throw new BadRequestException("Admin role missing after seeding");

    const existing = await this.prisma.user.findUnique({ where: { email: input.admin.email } });
    if (existing) throw new BadRequestException("A user with that email already exists");

    const passwordHash = await this.auth.hashPassword(input.admin.password);
    await this.prisma.user.create({
      data: {
        email: input.admin.email,
        name: input.admin.name,
        passwordHash,
        roleId: adminRole.id,
      },
    });

    const theme = await activateTheme(this.prisma, input.theme.themeKey);

    await this.settings.set(SETTINGS_KEYS.siteName, input.site.siteName);
    await this.settings.set(SETTINGS_KEYS.siteDescription, input.site.siteDescription ?? "");

    if (input.ai?.apiKey) {
      await this.settings.set(SETTINGS_KEYS.aiApiKey, input.ai.apiKey, true);
      if (input.ai.baseUrl) await this.settings.set(SETTINGS_KEYS.aiBaseUrl, input.ai.baseUrl);
      if (input.ai.model) await this.settings.set(SETTINGS_KEYS.aiModel, input.ai.model);
    }

    await seedSampleContent(this.prisma, input.site.siteName, theme.id);
    await seedDefaultMenu(this.prisma);

    await this.settings.set(SETTINGS_KEYS.installComplete, "true");

    return { ok: true, redirect: "/admin" };
  }
}
