"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

export default function SettingsPage() {
  const [site, setSite] = useState({ siteName: "", siteDescription: "" });
  const [ai, setAi] = useState({ apiKey: "", baseUrl: "", model: "" });
  const [aiConfigured, setAiConfigured] = useState(false);
  const [saved, setSaved] = useState("");
  const [aiTest, setAiTest] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  useEffect(() => {
    api<{ siteName: string; siteDescription: string }>("/settings/public").then((s) =>
      setSite({ siteName: s.siteName, siteDescription: s.siteDescription }),
    );
    api<{ configured: boolean; model: string; baseUrl: string }>("/ai/status")
      .then((s) => {
        setAiConfigured(s.configured);
        setAi((prev) => ({
          ...prev,
          baseUrl: s.baseUrl || prev.baseUrl,
          model: s.model || prev.model,
        }));
      })
      .catch(() => undefined);
  }, []);

  async function saveSite() {
    await api("/settings/site", { method: "PUT", json: site });
    flash("Site settings saved");
  }

  async function saveAi() {
    const payload: { apiKey?: string; baseUrl?: string; model?: string } = {};
    if (ai.apiKey.trim()) payload.apiKey = ai.apiKey.trim();
    if (ai.baseUrl.trim()) payload.baseUrl = ai.baseUrl.trim();
    if (ai.model.trim()) payload.model = ai.model.trim();
    await api("/settings/ai", { method: "PUT", json: payload });
    flash("AI settings saved");
    setAiConfigured(true);
    setAi({ ...ai, apiKey: "" });
    setAiTest(null);
  }

  async function testAiConnection() {
    setAiTesting(true);
    setAiTest(null);
    try {
      const res = await api<{ ok: boolean; model: string; latencyMs: number; reply: string }>(
        "/ai/test-connection",
        { method: "POST" },
      );
      setAiTest({
        ok: true,
        message: `Connected (${res.model}, ${res.latencyMs}ms): ${res.reply}`,
      });
    } catch (e) {
      setAiTest({
        ok: false,
        message: e instanceof Error ? e.message : "Connection test failed",
      });
    } finally {
      setAiTesting(false);
    }
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
          <p className="mb-2 text-sm text-slate-500">
            OpenAI-compatible API. {aiConfigured ? "A key is configured." : "No API key saved yet."}
          </p>
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <strong>VPS / self-hosted servers:</strong> OpenAI often blocks datacenter IPs (Cloudflare 403). Use{" "}
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">
              OpenRouter
            </a>
            : Base URL <code className="rounded bg-white px-1">https://openrouter.ai/api/v1</code>, OpenRouter API key, model{" "}
            <code className="rounded bg-white px-1">openai/gpt-4o-mini</code>.
          </div>
          <div className="space-y-3">
            <input
              className="fc-input"
              type="password"
              placeholder={aiConfigured ? "API key (leave blank to keep current)" : "API key"}
              value={ai.apiKey}
              onChange={(e) => setAi({ ...ai, apiKey: e.target.value })}
            />
            <input
              className="fc-input"
              placeholder="Base URL — https://openrouter.ai/api/v1"
              value={ai.baseUrl}
              onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })}
            />
            <input
              className="fc-input"
              placeholder="Model — openai/gpt-4o-mini"
              value={ai.model}
              onChange={(e) => setAi({ ...ai, model: e.target.value })}
            />
            <button onClick={saveAi} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
            <button
              type="button"
              onClick={testAiConnection}
              disabled={!aiConfigured || aiTesting}
              className="ml-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {aiTesting ? "Testing…" : "Test connection"}
            </button>
            {aiTest && (
              <div
                className={`rounded-lg p-3 text-sm ${aiTest.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
              >
                {aiTest.message}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
