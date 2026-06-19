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
import { createReadStream, existsSync } from "fs";
import { extname, join, normalize } from "path";
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

  // Public file serving (YYYY/MM/filename layout from MediaService.upload).
  @Public()
  @Get("file/:year/:month/:filename")
  serve(
    @Param("year") year: string,
    @Param("month") month: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !filename || filename.includes("..")) {
      throw new BadRequestException("Invalid path");
    }
    this.streamMediaFile(`${year}/${month}/${filename}`, res);
  }

  private streamMediaFile(relativePath: string, res: Response) {
    const root = process.env.UPLOAD_DIR ?? join(process.cwd(), "data", "uploads");
    const safe = normalize(join(root, relativePath));
    if (!safe.startsWith(normalize(root)) || !existsSync(safe)) {
      res.status(404).end();
      return;
    }
    const ext = extname(relativePath).toLowerCase();
    const types: Record<string, string> = {
      ".webp": "image/webp",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };
    if (types[ext]) res.setHeader("Content-Type", types[ext]);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    createReadStream(safe)
      .on("error", () => res.status(404).end())
      .pipe(res);
  }
}
