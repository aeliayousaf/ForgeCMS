import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/setup", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
