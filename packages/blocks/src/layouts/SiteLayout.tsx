import type { ReactNode } from "react";
import type { ThemeConfig } from "@forgecms/database";

export interface MenuLink {
  label: string;
  url: string;
}

export interface SiteLayoutProps {
  siteName: string;
  config: ThemeConfig;
  menu: MenuLink[];
  children: ReactNode;
}

export function themeCssVars(config: ThemeConfig): Record<string, string> {
  return {
    "--color-primary": config.colors.primary,
    "--color-secondary": config.colors.secondary,
    "--color-accent": config.colors.accent,
    "--color-background": config.colors.background,
    "--color-surface": config.colors.surface,
    "--color-text": config.colors.text,
    "--color-muted": config.colors.muted,
    "--font-heading": config.fonts.heading,
    "--font-body": config.fonts.body,
    "--radius": config.radius,
  };
}

export function SiteHeader({ siteName, menu, variant }: { siteName: string; menu: MenuLink[]; variant: string }) {
  const justify = variant === "centered" ? "center" : variant === "minimal" ? "flex-start" : "space-between";
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        gap: "2rem",
        padding: "1rem 1.5rem",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "var(--color-background)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <a href="/" style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-text)", textDecoration: "none" }}>
        {siteName}
      </a>
      <nav style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
        {menu.map((m) => (
          <a key={m.url} href={m.url} style={{ color: "var(--color-text)", textDecoration: "none", opacity: 0.85 }}>
            {m.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter({ siteName, menu, variant }: { siteName: string; menu: MenuLink[]; variant: string }) {
  return (
    <footer style={{ background: "var(--color-surface)", padding: "3rem 1.5rem", marginTop: "2rem" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ fontWeight: 700 }}>{siteName}</div>
        {variant === "columns" && (
          <nav style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            {menu.map((m) => (
              <a key={m.url} href={m.url} style={{ color: "var(--color-text)", opacity: 0.75, textDecoration: "none" }}>
                {m.label}
              </a>
            ))}
          </nav>
        )}
      </div>
      <p style={{ textAlign: "center", opacity: 0.6, marginTop: "2rem", fontSize: "0.875rem" }}>
        © {new Date().getFullYear()} {siteName}. Built with ForgeCMS.
      </p>
    </footer>
  );
}

export function SiteLayout({ siteName, config, menu, children }: SiteLayoutProps) {
  return (
    <div
      style={{
        ...(themeCssVars(config) as Record<string, string>),
        background: "var(--color-background)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body), system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SiteHeader siteName={siteName} menu={menu} variant={config.headerVariant} />
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter siteName={siteName} menu={menu} variant={config.footerVariant} />
    </div>
  );
}
