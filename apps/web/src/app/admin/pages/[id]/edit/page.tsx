"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Builder } from "@/components/builder/Builder";
import { emptyPageDocument, type PageDocument } from "@forgecms/shared";

interface PageData {
  id: string;
  title: string;
  slug: string;
  status: string;
  document: PageDocument;
}

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PageData>(`/pages/${id}`)
      .then(setData)
      .catch(() => setError("Could not load this page."));
  }, [id]);

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-slate-400">Loading editor...</div>;

  return (
    <Builder
      pageId={data.id}
      initialDocument={data.document ?? emptyPageDocument()}
      initialMeta={{ title: data.title, slug: data.slug, status: data.status }}
    />
  );
}
