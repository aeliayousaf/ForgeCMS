"use client";

import { Component, type ComponentType, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { getReactBitsEntry } from "@/lib/react-bits/manifest";

class ReactBitsErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ReactBits render error:", error, info);
  }

  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

function MissingComponent({ slug }: { slug: string }) {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-800">
      React Bits component <strong>{slug}</strong> is not installed. Run{" "}
      <code className="rounded bg-amber-100 px-1">pnpm react-bits:sync</code> and rebuild.
    </div>
  );
}

export function ReactBitsRenderer({
  slug,
  componentProps,
  children,
  className,
  style,
}: {
  slug: string;
  componentProps: Record<string, unknown>;
  children?: ReactNode;
  className?: string;
  style?: Record<string, string>;
}) {
  const entry = getReactBitsEntry(slug);
  const [Comp, setComp] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) return;
    let cancelled = false;
    entry
      .load()
      .then((mod) => {
        if (!cancelled) setComp(() => mod.default);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, entry]);

  if (!entry) return <MissingComponent slug={slug} />;
  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load {entry.title}: {loadError}
      </div>
    );
  }
  if (!Comp) {
    return (
      <div className="animate-pulse rounded-lg bg-slate-100 p-8 text-center text-xs text-slate-400">
        Loading {entry.title}…
      </div>
    );
  }

  const mergedProps = { ...entry.defaultProps, ...componentProps };
  const childContent = entry.supportsChildren ? children : undefined;

  return (
    <ReactBitsErrorBoundary
      fallback={
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {entry.title} crashed while rendering.
        </div>
      }
    >
      <div className={className} style={style}>
        <Comp {...mergedProps}>{childContent}</Comp>
      </div>
    </ReactBitsErrorBoundary>
  );
}
