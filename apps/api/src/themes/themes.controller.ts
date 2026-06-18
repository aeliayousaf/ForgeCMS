import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ThemesService } from "./themes.service";
import { Public, Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Controller("themes")
@UseGuards(PermissionsGuard)
export class ThemesController {
  constructor(private readonly themes: ThemesService) {}

  @Public()
  @Get("active")
  active() {
    return this.themes.active();
  }

  @Permissions(PERMISSIONS.THEME_MANAGE)
  @Get()
  list() {
    return this.themes.list();
  }

  @Permissions(PERMISSIONS.THEME_MANAGE)
  @Post("activate")
  activate(@Body() body: unknown) {
    const dto = parse(z.object({ key: z.string().min(1) }), body);
    return this.themes.activate(dto.key);
  }
}
