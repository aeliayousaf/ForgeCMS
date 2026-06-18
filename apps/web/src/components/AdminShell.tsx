"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  Image as ImageIcon,
  Blocks,
  Palette,
  Menu as MenuIcon,
  Users,
  Sparkles,
  Settings,
  Shield,
  DatabaseBackup,
  LogOut,
  ExternalLink,
  PanelLeft,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";

const PAGE_EDITOR = /^\/admin\/pages\/[^/]+\/edit\/?$/;

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/posts", label: "Blog Posts", icon: Newspaper },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/components", label: "Components", icon: Blocks },
  { href: "/admin/themes", label: "Themes", icon: Palette },
  { href: "/admin/menus", label: "Menus", icon: MenuIcon },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ai", label: "AI Assistant", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/security", label: "Security", icon: Shield },
  { href: "/admin/backups", label: "Backups", icon: DatabaseBackup },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPageEditor = PAGE_EDITOR.test(pathname);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const sidebarCollapsed = isPageEditor && !menuExpanded;

  async function logout() {
    await api("/auth/logout", { method: "POST", json: {} }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className={`flex bg-slate-50 text-slate-900 ${isPageEditor ? "h-screen overflow-hidden" : "min-h-screen"}`}
    >
      <aside
        className={`relative flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
          sidebarCollapsed ? "w-14" : "w-64"
        }`}
      >
        <div
          className={`flex items-center border-b border-slate-100 ${
            sidebarCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-4"
          }`}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setMenuExpanded(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              title="Expand menu"
            >
              <PanelLeft size={18} />
            </button>
          ) : (
            <>
              <span className="text-lg font-extrabold tracking-tight">ForgeCMS</span>
              {isPageEditor && (
                <button
                  type="button"
                  onClick={() => setMenuExpanded(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  title="Collapse menu"
                >
                  <PanelLeft size={18} className="rotate-180" />
                </button>
              )}
            </>
          )}
        </div>

        {isPageEditor && (
          <Link
            href="/admin/pages"
            className={`mx-2 mt-2 flex items-center gap-2 rounded-lg text-slate-600 hover:bg-slate-100 ${
              sidebarCollapsed ? "justify-center p-2" : "px-3 py-2 text-sm font-medium"
            }`}
            title="Back to pages"
          >
            <ArrowLeft size={18} />
            {!sidebarCollapsed && "Back to pages"}
          </Link>
        )}

        <nav className={`flex-1 space-y-0.5 overflow-y-auto ${sidebarCollapsed ? "px-1 py-2" : "px-2 py-2"}`}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={sidebarCollapsed ? label : undefined}
                className={`flex items-center rounded-lg text-sm font-medium transition ${
                  sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                } ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Icon size={18} />
                {!sidebarCollapsed && label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          title={sidebarCollapsed ? "Sign out" : undefined}
          className={`m-2 flex items-center rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 ${
            sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
          }`}
        >
          <LogOut size={18} />
          {!sidebarCollapsed && "Sign out"}
        </button>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!isPageEditor && (
          <header className="flex items-center justify-end border-b border-slate-200 bg-white px-8 py-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <ExternalLink size={16} />
              Preview site
            </a>
          </header>
        )}
        <main className={`flex-1 ${isPageEditor ? "min-h-0 overflow-hidden" : "overflow-x-hidden"}`}>{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
