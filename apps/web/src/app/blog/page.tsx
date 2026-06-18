import Link from "next/link";
import { serverApiSafe } from "@/lib/server-api";

interface PostSummary {
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
}

export default async function BlogIndex() {
  const posts = (await serverApiSafe<PostSummary[]>("/public/posts")) ?? [];
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "2rem" }}>Blog</h1>
      {posts.length === 0 && <p>No posts published yet.</p>}
      {posts.map((p) => (
        <Link key={p.slug} href={`/blog/${p.slug}`} style={{ display: "block", marginBottom: "1.5rem", textDecoration: "none", color: "inherit" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{p.title}</h2>
          {p.excerpt && <p style={{ opacity: 0.7 }}>{p.excerpt}</p>}
        </Link>
      ))}
    </div>
  );
}
