import { cookies } from "next/headers";

// Server-side API base: talks directly to the NestJS service inside the
// docker network, bypassing nginx for SSR data fetching.
const INTERNAL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function serverApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const res = await fetch(`${INTERNAL}/api${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Server API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function serverApiSafe<T = unknown>(path: string): Promise<T | null> {
  try {
    return await serverApi<T>(path);
  } catch {
    return null;
  }
}
