import type { ThemeConfig } from "@forgecms/blocks";
import type { PageDocument } from "@forgecms/shared";
import { PublicPageRenderer } from "./PublicPageRenderer";

export interface PublicPayload {
  page: {
    title: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    document: PageDocument;
  };
  site: { siteName: string; siteDescription: string };
  theme: { config: ThemeConfig } | null;
  menu: { label: string; url: string }[];
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

export function PublicPage({ payload }: { payload: PublicPayload }) {
  const config = payload.theme?.config ?? fallbackTheme;
  return (
    <PublicPageRenderer
      siteName={payload.site.siteName}
      config={config}
      menu={payload.menu}
      document={payload.page.document}
    />
  );
}
