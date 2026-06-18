import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import type { StorageAdapter, StoredObject } from "./storage.interface";

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly root = process.env.UPLOAD_DIR ?? join(process.cwd(), "data", "uploads");

  async put(buffer: Buffer, relativePath: string): Promise<StoredObject> {
    const full = join(this.root, relativePath);
    await fs.mkdir(dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { path: relativePath, url: this.resolveUrl(relativePath) };
  }

  async delete(relativePath: string): Promise<void> {
    try {
      await fs.unlink(join(this.root, relativePath));
    } catch {
      // ignore missing files
    }
  }

  // Files are served by the API under /api/media/file/* (see MediaController).
  resolveUrl(relativePath: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "/api";
    return `${base}/media/file/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
  }
}
