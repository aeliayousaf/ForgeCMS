import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { createReadStream } from "fs";
import { join, normalize } from "path";
import { MediaService } from "./media.service";
import { Public, Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Controller("media")
@UseGuards(PermissionsGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Permissions(PERMISSIONS.MEDIA_READ)
  @Get()
  list(@Query("folder") folder?: string, @Query("search") search?: string) {
    return this.media.list({ folder, search });
  }

  @Permissions(PERMISSIONS.MEDIA_READ)
  @Get("folders")
  folders() {
    return this.media.folders();
  }

  @Permissions(PERMISSIONS.MEDIA_WRITE)
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body("folder") folder?: string,
    @Body("altText") altText?: string,
  ) {
    return this.media.upload(file, folder ?? "/", altText);
  }

  @Permissions(PERMISSIONS.MEDIA_WRITE)
  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const dto = parse(
      z.object({
        altText: z.string().optional(),
        folder: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      body,
    );
    return this.media.update(id, dto);
  }

  @Permissions(PERMISSIONS.MEDIA_WRITE)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.media.remove(id);
  }

  // Public file serving. Path is normalized to prevent traversal.
  @Public()
  @Get("file/*path")
  serve(@Param("path") path: string | string[], @Res() res: Response) {
    const rel = Array.isArray(path) ? path.join("/") : path;
    const root = process.env.UPLOAD_DIR ?? join(process.cwd(), "data", "uploads");
    const safe = normalize(join(root, rel));
    if (!safe.startsWith(normalize(root))) {
      throw new BadRequestException("Invalid path");
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    createReadStream(safe)
      .on("error", () => res.status(404).end())
      .pipe(res);
  }
}
