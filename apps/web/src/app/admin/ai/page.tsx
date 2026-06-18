"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

export default function AiPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"website" | "content">("website");

  // Create Website
  const [biz, setBiz] = useState({ businessName: "", industry: "", services: "", audience: "", style: "Modern and professional" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Content generation
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState("rewrite");
  const [output, setOutput] = useState("");

  async function createWebsite() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api<{ pages: { id: string; title: string }[] }>("/ai/create-website", {
        method: "POST",
        json: biz,
      });
      setResult(`Created ${res.pages.length} draft pages: ${res.pages.map((p) => p.title).join(", ")}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      const res = await api<{ text?: string }>("/ai/generate", { method: "POST", json: { kind, prompt } });
      setOutput(res.text ?? "");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Generate content and entire websites" />
      <div className="max-w-3xl p-8">
        <div className="mb-6 flex gap-2">
          <button onClick={() => setTab("website")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "website" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}>
            Create Website
          </button>
          <button onClick={() => setTab("content")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "content" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}>
            Generate Content
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {tab === "website" ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <input className="fc-input" placeholder="Business name" value={biz.businessName} onChange={(e) => setBiz({ ...biz, businessName: e.target.value })} />
            <input className="fc-input" placeholder="Industry" value={biz.industry} onChange={(e) => setBiz({ ...biz, industry: e.target.value })} />
            <textarea className="fc-input" placeholder="Services (comma separated)" value={biz.services} onChange={(e) => setBiz({ ...biz, services: e.target.value })} />
            <input className="fc-input" placeholder="Target audience" value={biz.audience} onChange={(e) => setBiz({ ...biz, audience: e.target.value })} />
            <input className="fc-input" placeholder="Preferred style" value={biz.style} onChange={(e) => setBiz({ ...biz, style: e.target.value })} />
            <button onClick={createWebsite} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Generating..." : "Generate website"}
            </button>
            {result && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {result} <button className="ml-2 underline" onClick={() => router.push("/admin/pages")}>View pages</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <select className="fc-input" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="rewrite">Rewrite content</option>
              <option value="seo">SEO suggestions</option>
              <option value="faq">Generate FAQs</option>
              <option value="cta">Call to action</option>
              <option value="imagePrompt">Image prompt</option>
              <option value="layout">Suggest layout</option>
            </select>
            <textarea className="fc-input" rows={4} placeholder="Describe what you need..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <button onClick={generate} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Generating..." : "Generate"}
            </button>
            {output && <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{output}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}
