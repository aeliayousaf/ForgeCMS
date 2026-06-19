"use client";

import { use, useEffect, useState } from "react";
import type { ThemeConfig } from "@forgecms/blocks";
import type { PageDocument } from "@forgecms/shared";
import { api } from "@/lib/api";
import { PublicPageRenderer } from "@/components/PublicPageRenderer";

interface PageData {
  id: string;
  title: string;
  slug: string;
  status: string;
  document: PageDocument;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
}

interface ThemeRow {
  config: ThemeConfig;
}

interface MenuResponse {
  items: { label: string; url: string }[];
}

const fallbackTheme: ThemeConfig = {
  colors: {
    primary: "#4f46e5",
    secondary: "#1e293b",
    accent: "#6366f1",
    background: "#ffffff",
    surface: "#f1f5f9",
    text: "#0f172a",
    muted: "#64748b",
  },
  fonts: { heading: "Inter", body: "Inter" },
  radius: "0.5rem",
  headerVariant: "split",
  footerVariant: "columns",
};

export default function DraftPreviewPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [siteName, setSiteName] = useState("ForgeCMS");
  const [theme, setTheme] = useState<ThemeConfig>(fallbackTheme);
  const [menu, setMenu] = useState<{ label: string; url: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api<PageData>(`/pages/${pageId}`),
      api<SiteSettings>("/settings/public"),
      api<ThemeRow | null>("/themes/active"),
      api<MenuResponse>("/menus/location/primary"),
    ])
      .then(([pageData, site, activeTheme, menuData]) => {
        setPage(pageData);
        setSiteName(site.siteName);
        setTheme((activeTheme?.config as ThemeConfig | undefined) ?? fallbackTheme);
        setMenu(menuData.items.map((i) => ({ label: i.label, url: i.url })));
        setReady(true);
      })
      .catch(() => setError("Could not load preview. Save the page and try again."));
  }, [pageId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-red-600">
        {error}
      </div>
    );
  }

  if (!ready || !page) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading preview…</div>;
  }

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        Draft preview — visitors won&apos;t see this until you publish.
        {page.status !== "published" && " This page is not published yet."}
      </div>
      <PublicPageRenderer
        siteName={siteName}
        config={theme}
        menu={menu}
        document={page.document}
      />
    </>
  );
}
