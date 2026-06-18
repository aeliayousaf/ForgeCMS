import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverApiSafe } from "@/lib/server-api";
import { PublicPage, type PublicPayload } from "@/components/PublicPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await serverApiSafe<PublicPayload>(`/public/page/${slug.join("/")}`);
  if (!data) return { title: "Not found" };
  return {
    title: data.page.seoTitle ?? data.page.title,
    description: data.page.seoDescription ?? "",
  };
}

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const data = await serverApiSafe<PublicPayload>(`/public/page/${slug.join("/")}`);
  if (!data) notFound();
  return <PublicPage payload={data} />;
}
