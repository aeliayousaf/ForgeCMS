"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { api } from "@/lib/api";

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

  async function logout() {
    await api("/auth/logout", { method: "POST", json: {} }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-5 text-lg font-extrabold tracking-tight">ForgeCMS</div>
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
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
