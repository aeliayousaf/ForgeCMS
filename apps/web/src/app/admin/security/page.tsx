"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: { email: string } | null;
}

export default function SecurityPage() {
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [twoFa, setTwoFa] = useState<{ qr: string; secret: string } | null>(null);
  const [token, setToken] = useState("");
  const [audit, setAudit] = useState<AuditRow[]>([]);

  useEffect(() => {
    api<AuditRow[]>("/audit").then(setAudit).catch(() => setAudit([]));
  }, []);

  async function changePassword() {
    setMsg(null);
    try {
      await api("/auth/change-password", { method: "POST", json: pw });
      setMsg("Password updated");
      setPw({ current: "", next: "" });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function begin2fa() {
    const res = await api<{ qr: string; secret: string }>("/auth/2fa/begin", { method: "POST", json: {} });
    setTwoFa(res);
  }

  async function enable2fa() {
    await api("/auth/2fa/enable", { method: "POST", json: { token } });
    setMsg("Two-factor authentication enabled");
    setTwoFa(null);
    setToken("");
  }

  return (
    <div>
      <PageHeader title="Security" subtitle="Account protection and audit log" />
      <div className="max-w-2xl space-y-6 p-8">
        {msg && <div className="rounded-lg bg-slate-100 p-3 text-sm">{msg}</div>}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Change password</h3>
          <div className="space-y-3">
            <input className="fc-input" type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <input className="fc-input" type="password" placeholder="New password (min 10 chars)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <button onClick={changePassword} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Update password</button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Two-factor authentication</h3>
          {!twoFa ? (
            <button onClick={begin2fa} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Set up 2FA</button>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={twoFa.qr} alt="2FA QR code" className="h-40 w-40" />
              <p className="text-xs text-slate-500">Scan with an authenticator app, then enter the 6-digit code.</p>
              <input className="fc-input" placeholder="123456" value={token} onChange={(e) => setToken(e.target.value)} />
              <button onClick={enable2fa} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Enable</button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Audit log</h3>
          <div className="max-h-80 overflow-y-auto text-sm">
            {audit.map((a) => (
              <div key={a.id} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
                <span>
                  <strong>{a.action}</strong> {a.entity} {a.user?.email ? `· ${a.user.email}` : ""}
                </span>
                <span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {audit.length === 0 && <p className="text-slate-500">No activity recorded yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
