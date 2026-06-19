import { NextResponse, type NextRequest } from "next/server";

const INTERNAL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

type InstallState = "installed" | "not_installed" | "unknown";

async function getInstallState(): Promise<InstallState> {
  try {
    const res = await fetch(`${INTERNAL}/api/setup/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "unknown";
    const data = (await res.json()) as { installed: boolean };
    return data.installed ? "installed" : "not_installed";
  } catch {
    // Transient API/network errors must not send an existing site to the setup wizard.
    return "unknown";
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and API proxy.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/themes") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const installState = await getInstallState();

  if (installState === "not_installed") {
    if (pathname.startsWith("/setup")) return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  if (installState === "installed" && pathname.startsWith("/setup")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Gate the admin area, draft preview, and React Bits source API on the access cookie.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/react-bits-source")
  ) {
    const hasAccess = req.cookies.has("fc_access");
    if (!hasAccess) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
