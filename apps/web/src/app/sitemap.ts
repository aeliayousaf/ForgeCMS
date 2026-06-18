import type { MetadataRoute } from "next";
import { serverApiSafe } from "@/lib/server-api";

interface SitemapEntry {
  loc: string;
  lastmod: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost";
  const entries = (await serverApiSafe<SitemapEntry[]>("/public/sitemap")) ?? [];
  return entries.map((e) => ({
    url: `${base}${e.loc}`,
    lastModified: new Date(e.lastmod),
  }));
}
