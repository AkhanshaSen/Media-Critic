"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  getShelfAverageRating,
  updatePageTemplate,
  updateShareTemplate,
} from "@/features/entries/data";
import {
  ShareCardPreview,
  shareEntryReview,
  type SharePreviewTheme,
} from "@/features/entries/share-cards";
import {
  PAGE_TEMPLATES,
  PAGE_TEMPLATE_LABELS,
  SHARE_TEMPLATES,
  SHARE_TEMPLATE_LABELS,
  type MediaEntry,
  type PageTemplate,
  type ShareTemplate,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function TemplateExplorer({
  entry,
  pageTemplate,
  shareTemplate,
  open,
  onOpenChange,
  onPageTemplate,
  onShareTemplate,
}: {
  entry: MediaEntry;
  pageTemplate: PageTemplate;
  shareTemplate: ShareTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPageTemplate: (t: PageTemplate) => void;
  onShareTemplate: (t: ShareTemplate) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<SharePreviewTheme>("dark");
  const [showShelfAvg, setShowShelfAvg] = useState(false);
  const [shelfAverage, setShelfAverage] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !showShelfAvg) return;
    let cancelled = false;
    void getShelfAverageRating().then((avg) => {
      if (!cancelled) setShelfAverage(avg);
    });
    return () => {
      cancelled = true;
    };
  }, [open, showShelfAvg]);

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
    const result = await shareEntryReview(entry, {
      includeShelfAverage: showShelfAvg,
      shelfAverage,
    });
    if (result.ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (!result.aborted) {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <div
        id="share-layout"
        className="border-border/80 bg-card/40 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 backdrop-blur-md"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-tight">Share & layout</p>
          <p className="text-muted-foreground truncate text-[11px]">
            {PAGE_TEMPLATE_LABELS[pageTemplate]} ·{" "}
            {SHARE_TEMPLATE_LABELS[shareTemplate]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="border-border hover:bg-muted inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-xs font-medium"
        >
          Open share & layout
        </button>
      </div>
    );
  }

  return (
    <section
      id="share-layout"
      className="border-border/80 bg-card/50 z-20 space-y-4 rounded-2xl border p-4 shadow-xl shadow-black/30 backdrop-blur-md"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Share & layout
          </h2>
          <p className="text-muted-foreground text-xs">
            Copy your review, pick a share card, or change this title&apos;s page
            layout. Changes save to this title / your account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copyText()}
            className="border-border hover:bg-muted inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium"
          >
            {copied ? "Copied" : "Copy review text"}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="border-border hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border"
            aria-label="Close share and layout"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-white/10 p-0.5">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreviewTheme(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                previewTheme === t
                  ? "bg-amber-400 text-amber-950"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="text-muted-foreground inline-flex cursor-pointer items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={showShelfAvg}
            onChange={(e) => setShowShelfAvg(e.target.checked)}
            className="accent-amber-400 size-3.5 rounded"
          />
          All-time avg
        </label>
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
              theme={previewTheme}
              showShelfAverage={showShelfAvg}
              shelfAverage={shelfAverage}
            />
          ))}
        </div>
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </section>
  );
}

/** Collapsed by default so the entry page is readable; reopen via Share & layout. */
export function useLooksOpenState(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);
  return [open, setOpen];
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
