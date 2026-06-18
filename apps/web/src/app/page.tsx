import type { Metadata } from "next";
import { serverApiSafe } from "@/lib/server-api";
import { PublicPage, type PublicPayload } from "@/components/PublicPage";

export async function generateMetadata(): Promise<Metadata> {
  const data = await serverApiSafe<PublicPayload>("/public/home");
  return {
    title: data?.page.seoTitle ?? data?.site.siteName ?? "ForgeCMS",
    description: data?.page.seoDescription ?? data?.site.siteDescription ?? "",
  };
}

export default async function HomePage() {
  const data = await serverApiSafe<PublicPayload>("/public/home");
  if (!data) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <p>No homepage published yet.</p>
      </div>
    );
  }
  return <PublicPage payload={data} />;
}
