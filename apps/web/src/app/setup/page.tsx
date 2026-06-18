"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

interface Theme {
  id: string;
  key: string;
  name: string;
  category?: string;
}

const STEPS = ["Site", "Admin", "Database", "Theme", "AI", "Finish"];

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [site, setSite] = useState({ siteName: "", siteDescription: "" });
  const [admin, setAdmin] = useState({ name: "", email: "", password: "" });
  const [dbStatus, setDbStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeKey, setThemeKey] = useState("business");
  const [ai, setAi] = useState({ apiKey: "", baseUrl: "", model: "" });

  useEffect(() => {
    if (step === 3 && themes.length === 0) {
      api<Theme[]>("/setup/themes").then(setThemes).catch(() => setThemes([]));
    }
  }, [step, themes.length]);

  async function testDb() {
    setBusy(true);
    setError(null);
    try {
      await api("/setup/test-db", { method: "POST", json: {} });
      setDbStatus("ok");
    } catch {
      setDbStatus("fail");
      setError("Could not connect to the database. Check your configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setError(null);
    if (step === 0 && !site.siteName.trim()) return setError("Please enter a site name.");
    if (step === 1) {
      if (!admin.name || !admin.email) return setError("Name and email are required.");
      if (admin.password.length < 10) return setError("Password must be at least 10 characters.");
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await api("/setup/complete", {
        method: "POST",
        json: {
          site,
          admin,
          theme: { themeKey },
          ai: ai.apiKey ? ai : undefined,
        },
      });
      // Now log the admin in automatically.
      await api("/auth/login", {
        method: "POST",
        json: { email: admin.email, password: admin.password },
      });
      router.push("/admin");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Installation failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.08)", padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Welcome to ForgeCMS</h1>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Let&rsquo;s get your site set up in a few quick steps.</p>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 6, borderRadius: 3, background: i <= step ? "#4f46e5" : "#e2e8f0" }} />
              <span style={{ fontSize: 11, color: i === step ? "#4f46e5" : "#94a3b8" }}>{s}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {step === 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Site name">
              <input className="fc-input" value={site.siteName} onChange={(e) => setSite({ ...site, siteName: e.target.value })} placeholder="My Company" />
            </Field>
            <Field label="Site description">
              <textarea className="fc-input" value={site.siteDescription} onChange={(e) => setSite({ ...site, siteDescription: e.target.value })} placeholder="A short tagline" rows={3} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Your name">
              <input className="fc-input" value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="fc-input" type="email" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
            </Field>
            <Field label="Password (min 10 characters)">
              <input className="fc-input" type="password" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: 16 }}>
            <p style={{ color: "#475569", fontSize: 14 }}>
              We&rsquo;ll verify the database connection. With the default Docker setup this should pass automatically.
            </p>
            <button className="fc-btn fc-btn-outline" onClick={testDb} disabled={busy}>
              {busy ? "Testing..." : "Test connection"}
            </button>
            {dbStatus === "ok" && <p style={{ color: "#16a34a" }}>✓ Database connection successful</p>}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            {themes.map((t) => (
              <button
                key={t.key}
                onClick={() => setThemeKey(t.key)}
                style={{
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 12,
                  border: themeKey === t.key ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.category}</div>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ color: "#475569", fontSize: 14 }}>Optional: add an OpenAI-compatible API key to enable the AI Assistant. You can do this later in Settings.</p>
            <Field label="API key">
              <input className="fc-input" value={ai.apiKey} onChange={(e) => setAi({ ...ai, apiKey: e.target.value })} placeholder="sk-..." />
            </Field>
            <Field label="Base URL (optional)">
              <input className="fc-input" value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
            </Field>
            <Field label="Model (optional)">
              <input className="fc-input" value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} placeholder="gpt-4o-mini" />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ color: "#475569" }}>Ready to install ForgeCMS with these settings:</p>
            <ul style={{ color: "#475569", fontSize: 14, lineHeight: 1.8 }}>
              <li>Site: <strong>{site.siteName}</strong></li>
              <li>Admin: <strong>{admin.email}</strong></li>
              <li>Theme: <strong>{themeKey}</strong></li>
              <li>AI: <strong>{ai.apiKey ? "Configured" : "Skipped"}</strong></li>
            </ul>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <button className="fc-btn fc-btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="fc-btn fc-btn-primary" onClick={next} disabled={busy}>
              Continue
            </button>
          ) : (
            <button className="fc-btn fc-btn-primary" onClick={finish} disabled={busy}>
              {busy ? "Installing..." : "Finish installation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</span>
      {children}
    </label>
  );
}
