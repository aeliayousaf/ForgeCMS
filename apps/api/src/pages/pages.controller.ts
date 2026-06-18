import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { PagesService } from "./pages.service";
import { Permissions, CurrentUser, type AuthUser } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AuditService } from "../audit/audit.service";
import { PERMISSIONS, createPageSchema, updatePageSchema } from "@forgecms/shared";
import { parse } from "../common/zod";

@Controller("pages")
@UseGuards(PermissionsGuard)
export class PagesController {
  constructor(
    private readonly pages: PagesService,
    private readonly audit: AuditService,
  ) {}

  @Permissions(PERMISSIONS.PAGE_READ)
  @Get()
  list() {
    return this.pages.list();
  }

  @Permissions(PERMISSIONS.PAGE_READ)
  @Get(":id")
  get(@Param("id") id: string) {
    return this.pages.get(id);
  }

  @Permissions(PERMISSIONS.PAGE_READ)
  @Get(":id/versions")
  versions(@Param("id") id: string) {
    return this.pages.versions(id);
  }

  @Permissions(PERMISSIONS.PAGE_WRITE)
  @Post()
  async create(@Body() body: unknown, @CurrentUser() user: AuthUser, @Req() req: Request) {
    const dto = parse(createPageSchema, body);
    const page = await this.pages.create(dto, user.id);
    await this.audit.log({ userId: user.id, action: "create", entity: "page", entityId: page.id, ip: req.ip });
    return page;
  }

  @Permissions(PERMISSIONS.PAGE_WRITE)
  @Put(":id")
  async save(@Param("id") id: string, @Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = parse(updatePageSchema, body);
    return this.pages.saveDraft(
      id,
      dto.document ?? (await this.pages.get(id)).document,
      dto,
      user.id,
    );
  }

  @Permissions(PERMISSIONS.PAGE_PUBLISH)
  @Post(":id/publish")
  async publish(@Param("id") id: string, @CurrentUser() user: AuthUser, @Req() req: Request) {
    const page = await this.pages.publish(id);
    await this.audit.log({ userId: user.id, action: "publish", entity: "page", entityId: id, ip: req.ip });
    return page;
  }

  @Permissions(PERMISSIONS.PAGE_PUBLISH)
  @Post(":id/unpublish")
  unpublish(@Param("id") id: string) {
    return this.pages.unpublish(id);
  }

  @Permissions(PERMISSIONS.PAGE_WRITE)
  @Post(":id/duplicate")
  duplicate(@Param("id") id: string) {
    return this.pages.duplicate(id);
  }

  @Permissions(PERMISSIONS.PAGE_WRITE)
  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser, @Req() req: Request) {
    await this.audit.log({ userId: user.id, action: "delete", entity: "page", entityId: id, ip: req.ip });
    return this.pages.remove(id);
  }
}
