"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface BuildSiteResult {
  siteName: string;
  siteDescription: string;
  themeKey: string | null;
  menu: { label: string; url: string }[];
  pages: { id: string; title: string; slug: string; published: boolean }[];
  published: boolean;
}

interface AiStatus {
  configured: boolean;
  model: string;
}

function formatError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.message.includes("API key")) {
      return `${e.message} Go to Settings → AI Integration and add your OpenAI-compatible API key.`;
    }
    return e.message;
  }
  return "Generation failed";
}

export default function AiPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"build" | "content">("build");
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  const [prompt, setPrompt] = useState("");
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BuildSiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contentPrompt, setContentPrompt] = useState("");
  const [kind, setKind] = useState("rewrite");
  const [output, setOutput] = useState("");

  useEffect(() => {
    api<AiStatus>("/ai/status").then(setAiStatus).catch(() => setAiStatus({ configured: false, model: "" }));
  }, []);

  async function buildSite() {
    const trimmed = prompt.trim();
    if (trimmed.length < 20) {
      setError("Please describe your business in at least a few sentences (20+ characters).");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api<BuildSiteResult>("/ai/build-site", {
        method: "POST",
        json: { prompt: trimmed, publish },
      });
      setResult(res);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    const trimmed = contentPrompt.trim();
    if (!trimmed) {
      setError("Enter a prompt describing what you want to generate.");
      return;
    }
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      const res = await api<{ text?: string }>("/ai/generate", {
        method: "POST",
        json: { kind, prompt: trimmed },
      });
      setOutput(res.text ?? "");
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Describe your business — get a full site with pages, menu, and theme" />
      <div className="max-w-3xl p-8">
        {aiStatus && !aiStatus.configured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No AI API key is configured.{" "}
            <Link href="/admin/settings" className="font-medium text-indigo-700 underline">
              Add one in Settings → AI Integration
            </Link>{" "}
            before generating content.
          </div>
        )}

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("build")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "build" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}
          >
            Build Website
          </button>
          <button
            onClick={() => setTab("content")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "content" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"}`}
          >
            Generate Content
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {tab === "build" ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Describe your business</label>
              <p className="mb-2 text-xs text-slate-500">
                Include what you do, who you serve, your tone, and any pages you want. The AI will generate page content,
                navigation menu, site name, and pick a theme. Header and footer are added automatically.
              </p>
              <textarea
                className="fc-input"
                rows={8}
                placeholder="Example: I run a family-owned plumbing company in Austin called QuickFix Plumbing. We offer 24/7 emergency repairs, drain cleaning, and water heater installation. Our tone is friendly and trustworthy. We need Home, Services, About, and Contact pages."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">{prompt.trim().length} / 20 min characters</p>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
              Publish pages immediately (otherwise saved as drafts)
            </label>

            <button
              onClick={buildSite}
              disabled={busy || prompt.trim().length < 20 || aiStatus?.configured === false}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Building your site… (may take 2–4 min)" : "Build website"}
            </button>

            {result && (
              <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <p className="font-semibold">Site created for {result.siteName}</p>
                <ul className="list-inside list-disc space-y-1 text-green-800">
                  <li>
                    {result.pages.length} page{result.pages.length === 1 ? "" : "s"}:{" "}
                    {result.pages.map((p) => p.title).join(", ")}
                    {result.published ? " (published)" : " (drafts)"}
                  </li>
                  <li>Theme: {result.themeKey ?? "unchanged"}</li>
                  <li>Menu: {result.menu.map((m) => m.label).join(" · ")}</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button type="button" className="font-medium text-indigo-700 underline" onClick={() => router.push("/admin/pages")}>
                    Edit pages
                  </button>
                  {result.published && (
                    <Link href="/" target="_blank" className="font-medium text-indigo-700 underline">
                      View live site
                    </Link>
                  )}
                  {!result.published && result.pages[0] && (
                    <Link href={`/admin/pages/${result.pages[0].id}/edit`} className="font-medium text-indigo-700 underline">
                      Open in builder
                    </Link>
                  )}
                </div>
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
            <textarea
              className="fc-input"
              rows={4}
              placeholder="Describe what you need..."
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
            />
            <button
              onClick={generate}
              disabled={busy || !contentPrompt.trim() || aiStatus?.configured === false}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Generating..." : "Generate"}
            </button>
            {output && <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{output}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}
