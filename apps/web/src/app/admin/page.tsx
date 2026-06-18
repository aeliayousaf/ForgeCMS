"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface Stats {
  pages: number;
  publishedPages: number;
  posts: number;
  media: number;
  users: number;
  themes: number;
  recentPages: { id: string; title: string; slug: string; status: string; updatedAt: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/dashboard/stats").then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Pages", value: stats?.pages, href: "/admin/pages" },
    { label: "Published", value: stats?.publishedPages, href: "/admin/pages" },
    { label: "Blog posts", value: stats?.posts, href: "/admin/posts" },
    { label: "Media files", value: stats?.media, href: "/admin/media" },
    { label: "Users", value: stats?.users, href: "/admin/users" },
    { label: "Themes", value: stats?.themes, href: "/admin/themes" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back to ForgeCMS"
        action={
          <Link href="/admin/ai" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Create Website With AI
          </Link>
        }
      />
      <div className="p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => (
            <Link key={c.label} href={c.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm">
              <div className="text-3xl font-bold">{c.value ?? "—"}</div>
              <div className="text-sm text-slate-500">{c.label}</div>
            </Link>
          ))}
        </div>

        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent pages</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {stats?.recentPages?.length ? (
            stats.recentPages.map((p) => (
              <Link
                key={p.id}
                href={`/admin/pages/${p.id}/edit`}
                className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0 hover:bg-slate-50"
              >
                <span className="font-medium">{p.title}</span>
                <span className={`text-xs ${p.status === "published" ? "text-green-600" : "text-amber-600"}`}>{p.status}</span>
              </Link>
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">No pages yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
