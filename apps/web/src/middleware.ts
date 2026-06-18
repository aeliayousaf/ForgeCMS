import { NextResponse, type NextRequest } from "next/server";

const INTERNAL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

async function isInstalled(): Promise<boolean> {
  try {
    const res = await fetch(`${INTERNAL}/api/setup/status`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { installed: boolean };
    return data.installed;
  } catch {
    // If the API is unreachable, fail open to the setup screen.
    return false;
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

  const installed = await isInstalled();

  if (!installed) {
    if (pathname.startsWith("/setup")) return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Already installed: keep users out of the wizard.
  if (pathname.startsWith("/setup")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Gate the admin area on the presence of an access cookie. The API still
  // enforces real authorization on every request.
  if (pathname.startsWith("/admin")) {
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
