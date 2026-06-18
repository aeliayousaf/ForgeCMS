import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer, SiteLayout, type ThemeConfig } from "@forgecms/blocks";
import type { PageDocument } from "@forgecms/shared";
import { serverApiSafe } from "@/lib/server-api";

interface PostPayload {
  post: { title: string; seoTitle?: string | null; seoDescription?: string | null; document: PageDocument };
  site: { siteName: string; siteDescription: string };
  theme: { config: ThemeConfig } | null;
  menu: { label: string; url: string }[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await serverApiSafe<PostPayload>(`/public/post/${slug}`);
  return { title: data?.post.seoTitle ?? data?.post.title ?? "Post" };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await serverApiSafe<PostPayload>(`/public/post/${slug}`);
  if (!data) notFound();
  const config = data.theme?.config;
  const content = (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>{data.post.title}</h1>
      <BlockRenderer document={data.post.document} />
    </article>
  );
  if (!config) return content;
  return (
    <SiteLayout siteName={data.site.siteName} config={config} menu={data.menu}>
      {content}
    </SiteLayout>
  );
}
