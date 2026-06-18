"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/login", {
        method: "POST",
        json: { email, password, totp: totp || undefined },
      });
      router.push(params.get("next") ?? "/admin");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.message.includes("2FA")) {
        setNeedsTotp(true);
        setError("Enter your 2FA code.");
      } else {
        setError(err instanceof ApiError ? err.message : "Login failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
      <form onSubmit={submit} style={{ width: 380, background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.08)", display: "grid", gap: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Sign in to ForgeCMS</h1>
        {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 10, borderRadius: 8, fontSize: 14 }}>{error}</div>}
        <input className="fc-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="fc-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {needsTotp && (
          <input className="fc-input" placeholder="2FA code" value={totp} onChange={(e) => setTotp(e.target.value)} />
        )}
        <button className="fc-btn fc-btn-primary" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
