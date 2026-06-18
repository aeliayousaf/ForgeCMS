import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import sharp from "sharp";
import { extname } from "path";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { STORAGE_ADAPTER, type StorageAdapter } from "../storage/storage.interface";
import { ALLOWED_UPLOAD_MIME, ALLOWED_IMAGE_MIME } from "@forgecms/shared";

// Magic-byte signatures to verify declared MIME types are not spoofed.
const MAGIC: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  private verifyMagic(buffer: Buffer, mime: string) {
    // SVG and webp/mp4 are validated by MIME allow-list only; others by bytes.
    const sig = MAGIC.find((m) => m.mime === mime);
    if (!sig) return;
    const ok = sig.bytes.every((b, i) => buffer[i] === b);
    if (!ok) throw new BadRequestException("File content does not match its type");
  }

  async upload(file: Express.Multer.File, folder: string, altText?: string) {
    if (!file) throw new BadRequestException("No file provided");
    if (!ALLOWED_UPLOAD_MIME.includes(file.mimetype as (typeof ALLOWED_UPLOAD_MIME)[number])) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 25);
    if (file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`File exceeds ${maxMb}MB limit`);
    }
    this.verifyMagic(file.buffer, file.mimetype);

    const now = new Date();
    const ext = extname(file.originalname).toLowerCase() || ".bin";
    const safeName = `${randomBytes(8).toString("hex")}${ext}`;
    const rel = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${safeName}`;

    const stored = await this.storage.put(file.buffer, rel);

    let width: number | undefined;
    let height: number | undefined;
    let thumbnailPath: string | undefined;

    const isRasterImage =
      ALLOWED_IMAGE_MIME.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME)[number]) &&
      file.mimetype !== "image/svg+xml";

    if (isRasterImage) {
      try {
        const meta = await sharp(file.buffer).metadata();
        width = meta.width;
        height = meta.height;
        const thumb = await sharp(file.buffer)
          .resize(400, 400, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        const thumbRel = rel.replace(ext, "_thumb.webp");
        const thumbStored = await this.storage.put(thumb, thumbRel);
        thumbnailPath = thumbStored.path;
      } catch {
        // non-fatal: keep original without thumbnail
      }
    }

    return this.prisma.mediaFile.create({
      data: {
        filename: safeName,
        originalName: file.originalname,
        path: stored.path,
        thumbnailPath,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        folder: folder || "/",
        altText,
      },
    });
  }

  async list(params: { folder?: string; search?: string }) {
    const files = await this.prisma.mediaFile.findMany({
      where: {
        folder: params.folder || undefined,
        OR: params.search
          ? [
              { originalName: { contains: params.search } },
              { altText: { contains: params.search } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
    return files.map((f) => ({
      ...f,
      url: this.storage.resolveUrl(f.path),
      thumbnailUrl: f.thumbnailPath ? this.storage.resolveUrl(f.thumbnailPath) : null,
    }));
  }

  folders() {
    return this.prisma.mediaFile
      .findMany({ select: { folder: true }, distinct: ["folder"] })
      .then((rows) => rows.map((r) => r.folder));
  }

  async update(id: string, data: { altText?: string; folder?: string; tags?: string[] }) {
    return this.prisma.mediaFile.update({
      where: { id },
      data: { altText: data.altText, folder: data.folder, tags: data.tags as object },
    });
  }

  async remove(id: string) {
    const file = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (file) {
      await this.storage.delete(file.path);
      if (file.thumbnailPath) await this.storage.delete(file.thumbnailPath);
      await this.prisma.mediaFile.delete({ where: { id } });
    }
    return { ok: true };
  }

  count() {
    return this.prisma.mediaFile.count();
  }
}
