"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function requestTimeout(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

function parseApiErrorBody(
  status: number,
  text: string,
): { message: string; errors?: Record<string, string[]> } {
  let data: {
    message?: string | string[] | { message?: string; errors?: Record<string, string[]> };
    errors?: Record<string, string[]>;
  } | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // nginx/HTML error pages are not JSON
    }
  }

  const nested =
    data?.message && typeof data.message === "object" && !Array.isArray(data.message)
      ? data.message
      : null;
  const errors = nested?.errors ?? data?.errors;
  const raw = nested?.message ?? data?.message;

  let message =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? raw.join(", ")
        : status === 403
          ? "Session expired or invalid CSRF token — refresh the page and try again"
          : text && !data
            ? `Request failed (${status})`
            : "Request failed";

  if (errors && Object.keys(errors).length > 0) {
    const detail = Object.entries(errors)
      .flatMap(([field, msgs]) => (msgs ?? []).map((m) => `${field}: ${m}`))
      .join("; ");
    if (detail) {
      message = message === "Validation failed" || message === "Request failed" ? detail : `${message} (${detail})`;
    }
  }

  return { message, errors };
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { json?: unknown; _retried?: boolean } = {},
): Promise<T> {
  const { json, headers, _retried, ...rest } = options;
  const csrf = getCookie("fc_csrf");
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      credentials: "include",
      signal: rest.signal ?? requestTimeout(60_000),
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(0, "Request timed out — check that the API is running");
    }
    throw new ApiError(0, "Network error — could not reach the server");
  }

  if (res.status === 401 && !_retried && typeof window !== "undefined") {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      signal: requestTimeout(15_000),
    });
    if (refreshed.ok) return api<T>(path, { ...options, _retried: true });
  }

  const text = await res.text();
  if (!res.ok) {
    const { message, errors } = parseApiErrorBody(res.status, text);
    throw new ApiError(res.status, message, errors);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/** Multipart upload (e.g. media). Uses same-origin /api and detects redirect-to-GET failures. */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  options: { signal?: AbortSignal } = {},
): Promise<T> {
  const csrf = getCookie("fc_csrf");
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      redirect: "manual",
      signal: options.signal ?? requestTimeout(120_000),
      headers: csrf ? { "x-csrf-token": csrf } : {},
      body: formData,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(0, "Upload timed out — check that the API is running");
    }
    throw new ApiError(0, "Network error — could not reach the server");
  }

  if (res.type === "opaqueredirect" || res.status === 301 || res.status === 302 || res.status === 303) {
    throw new ApiError(
      res.status,
      "Upload was redirected and may have failed — open the admin over HTTPS (https://…) and try again",
    );
  }

  const text = await res.text();
  if (!res.ok) {
    const { message, errors } = parseApiErrorBody(res.status, text);
    throw new ApiError(res.status, message, errors);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
