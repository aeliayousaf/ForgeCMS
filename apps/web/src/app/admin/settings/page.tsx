"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

export default function SettingsPage() {
  const [site, setSite] = useState({ siteName: "", siteDescription: "" });
  const [ai, setAi] = useState({ apiKey: "", baseUrl: "", model: "" });
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api<{ siteName: string; siteDescription: string }>("/settings/public").then((s) =>
      setSite({ siteName: s.siteName, siteDescription: s.siteDescription }),
    );
  }, []);

  async function saveSite() {
    await api("/settings/site", { method: "PUT", json: site });
    flash("Site settings saved");
  }

  async function saveAi() {
    await api("/settings/ai", { method: "PUT", json: ai });
    flash("AI settings saved");
    setAi({ ...ai, apiKey: "" });
  }

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(""), 1500);
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Site and integration configuration" />
      <div className="max-w-2xl space-y-6 p-8">
        {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{saved}</div>}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">General</h3>
          <div className="space-y-3">
            <input className="fc-input" placeholder="Site name" value={site.siteName} onChange={(e) => setSite({ ...site, siteName: e.target.value })} />
            <textarea className="fc-input" placeholder="Site description" value={site.siteDescription} onChange={(e) => setSite({ ...site, siteDescription: e.target.value })} />
            <button onClick={saveSite} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">AI Integration</h3>
          <p className="mb-3 text-sm text-slate-500">OpenAI-compatible. Leave the key blank to keep the existing one.</p>
          <div className="space-y-3">
            <input className="fc-input" placeholder="API key" value={ai.apiKey} onChange={(e) => setAi({ ...ai, apiKey: e.target.value })} />
            <input className="fc-input" placeholder="Base URL (e.g. http://ollama:11434/v1)" value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} />
            <input className="fc-input" placeholder="Model (e.g. gpt-4o-mini)" value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} />
            <button onClick={saveAi} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
          </div>
        </section>
      </div>
    </div>
  );
}
