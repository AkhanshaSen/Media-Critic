"use client";

import { useState } from "react";

import {
  updatePageTemplate,
  updateShareTemplate,
} from "@/features/entries/data";
import { buildShareText, ShareCardPreview } from "@/features/entries/share-cards";
import {
  PAGE_TEMPLATES,
  PAGE_TEMPLATE_LABELS,
  SHARE_TEMPLATES,
  type MediaEntry,
  type PageTemplate,
  type ShareTemplate,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function TemplateExplorer({
  entry,
  pageTemplate,
  shareTemplate,
  onPageTemplate,
  onShareTemplate,
}: {
  entry: MediaEntry;
  pageTemplate: PageTemplate;
  shareTemplate: ShareTemplate;
  onPageTemplate: (t: PageTemplate) => void;
  onShareTemplate: (t: ShareTemplate) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickPage(t: PageTemplate) {
    if (t === pageTemplate || busy) return;
    setBusy(true);
    setError(null);
    onPageTemplate(t);
    const result = await updatePageTemplate(entry.id, t);
    if (!result.ok) {
      setError(result.error);
    }
    setBusy(false);
  }

  async function pickShare(t: ShareTemplate) {
    if (t === shareTemplate || busy) return;
    setBusy(true);
    setError(null);
    onShareTemplate(t);
    const result = await updateShareTemplate(t);
    if (!result.ok) {
      setError(result.error);
    }
    setBusy(false);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildShareText(entry));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Try again.");
    }
  }

  return (
    <section className="border-border/80 bg-card/50 sticky top-14 z-20 space-y-4 rounded-2xl border p-4 shadow-xl shadow-black/30 backdrop-blur-md">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Looks</h2>
          <p className="text-muted-foreground text-xs">
            Freely explore page layouts and share-card styles. Changes save to
            this title / your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyText()}
          className="border-border hover:bg-muted inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium"
        >
          {copied ? "Copied" : "Copy review text"}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-widest text-amber-300/90 uppercase">
          Page layout
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAGE_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              disabled={busy}
              onClick={() => void pickPage(t)}
              className={cn(
                "rounded-xl border p-2 text-left transition-all",
                pageTemplate === t
                  ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40"
                  : "border-white/10 hover:border-amber-400/40",
              )}
            >
              <LayoutThumb kind={t} />
              <p className="mt-2 text-xs font-medium">
                {PAGE_TEMPLATE_LABELS[t]}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-widest text-amber-300/90 uppercase">
          Share card
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {SHARE_TEMPLATES.map((t) => (
            <ShareCardPreview
              key={t}
              entry={entry}
              template={t}
              selected={shareTemplate === t}
              onSelect={() => void pickShare(t)}
            />
          ))}
        </div>
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </section>
  );
}

function LayoutThumb({ kind }: { kind: PageTemplate }) {
  if (kind === "magazine") {
    return (
      <div className="flex aspect-[16/10] gap-1 overflow-hidden rounded-lg bg-black/50 p-1.5">
        <div className="w-1/3 rounded bg-amber-400/30" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-2 w-4/5 rounded bg-white/40" />
          <div className="h-1.5 w-full rounded bg-white/20" />
          <div className="h-1.5 w-3/4 rounded bg-white/15" />
        </div>
      </div>
    );
  }
  if (kind === "minimal") {
    return (
      <div className="flex aspect-[16/10] items-center gap-1.5 overflow-hidden rounded-lg bg-black/50 p-1.5">
        <div className="h-full w-1/4 rounded bg-white/25" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-2 w-2/3 rounded bg-white/35" />
          <div className="h-1.5 w-1/2 rounded bg-amber-400/50" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-gradient-to-br from-amber-900/50 to-black">
      <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black p-1.5">
        <div className="h-2 w-3/4 rounded bg-white/50" />
        <div className="h-1.5 w-1/3 rounded bg-amber-400/70" />
      </div>
    </div>
  );
}
