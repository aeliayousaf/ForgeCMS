import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AiService } from "./ai.service";
import { Permissions, CurrentUser, type AuthUser } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS, aiBuildSiteSchema, aiCreateWebsiteSchema, aiGenerateSchema } from "@forgecms/shared";
import { parse } from "../common/zod";

@Controller("ai")
@UseGuards(PermissionsGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Permissions(PERMISSIONS.AI_USE)
  @Get("status")
  status() {
    return this.ai.getStatus();
  }

  @Permissions(PERMISSIONS.AI_USE)
  @Post("generate")
  generate(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = parse(aiGenerateSchema, body);
    return this.ai.generate(user.id, dto.kind, dto.prompt, dto.context);
  }

  @Permissions(PERMISSIONS.AI_USE)
  @Post("test-connection")
  testConnection() {
    return this.ai.testConnection();
  }

  @Permissions(PERMISSIONS.AI_USE)
  @Post("build-site")
  buildSite(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = parse(aiBuildSiteSchema, body);
    return this.ai.buildSite(user.id, dto);
  }

  @Permissions(PERMISSIONS.AI_USE)
  @Post("create-website")
  createWebsite(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = parse(aiCreateWebsiteSchema, body);
    return this.ai.createWebsite(user.id, dto);
  }

  @Permissions(PERMISSIONS.AI_USE)
  @Get("history")
  history(@CurrentUser() user: AuthUser) {
    return this.ai.history(user.id);
  }
}
