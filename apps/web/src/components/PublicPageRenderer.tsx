"use client";

import "@/lib/register-blocks";
import { BlockRenderer, SiteLayout, type ThemeConfig } from "@forgecms/blocks";
import type { PageDocument } from "@forgecms/shared";

export function PublicPageRenderer({
  siteName,
  config,
  menu,
  document,
}: {
  siteName: string;
  config: ThemeConfig;
  menu: { label: string; url: string }[];
  document: PageDocument;
}) {
  return (
    <SiteLayout siteName={siteName} config={config} menu={menu}>
      <BlockRenderer document={document} />
    </SiteLayout>
  );
}
