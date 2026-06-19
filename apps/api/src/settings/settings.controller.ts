import { BadRequestException, Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { Public, Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS, SETTINGS_KEYS } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Controller("settings")
@UseGuards(PermissionsGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get("public")
  getPublic() {
    return this.settings.getPublic();
  }

  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  @Put("site")
  async updateSite(@Body() body: unknown) {
    const dto = parse(
      z.object({ siteName: z.string().min(1), siteDescription: z.string().optional() }),
      body,
    );
    await this.settings.set(SETTINGS_KEYS.siteName, dto.siteName);
    await this.settings.set(SETTINGS_KEYS.siteDescription, dto.siteDescription ?? "");
    return { ok: true };
  }

  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  @Put("ai")
  async updateAi(@Body() body: unknown) {
    const dto = parse(
      z.object({
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
        model: z.string().optional(),
      }),
      body,
    );
    if (dto.apiKey !== undefined && dto.apiKey !== "") {
      await this.settings.set(SETTINGS_KEYS.aiApiKey, dto.apiKey, true);
    }
    if (dto.baseUrl !== undefined && dto.baseUrl !== "") {
      if (!/^https?:\/\/.+/.test(dto.baseUrl)) {
        throw new BadRequestException("Base URL must start with http:// or https://");
      }
      await this.settings.set(SETTINGS_KEYS.aiBaseUrl, dto.baseUrl.replace(/\/$/, ""));
    }
    if (dto.model !== undefined && dto.model !== "") {
      await this.settings.set(SETTINGS_KEYS.aiModel, dto.model);
    }
    return { ok: true };
  }
}
