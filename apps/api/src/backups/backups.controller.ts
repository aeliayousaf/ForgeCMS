import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { BackupsService } from "./backups.service";
import { Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Controller("backups")
@UseGuards(PermissionsGuard)
export class BackupsController {
  constructor(private readonly backups: BackupsService) {}

  @Permissions(PERMISSIONS.BACKUP_MANAGE)
  @Get()
  list() {
    return this.backups.list();
  }

  @Permissions(PERMISSIONS.BACKUP_MANAGE)
  @Post()
  create(@Body() body: unknown) {
    const dto = parse(z.object({ type: z.enum(["database", "files", "full"]).default("full") }), body);
    return this.backups.create(dto.type);
  }

  @Permissions(PERMISSIONS.BACKUP_MANAGE)
  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const { stream, filename } = await this.backups.streamFile(id);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    stream.pipe(res);
  }

  @Permissions(PERMISSIONS.BACKUP_MANAGE)
  @Post(":id/restore")
  restore(@Param("id") id: string) {
    return this.backups.restore(id);
  }

  @Permissions(PERMISSIONS.BACKUP_MANAGE)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.backups.remove(id);
  }
}
