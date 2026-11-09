"use client";

import { useState } from "react";

import { updatePageTemplate } from "@/features/entries/data";
import {
  PAGE_TEMPLATES,
  PAGE_TEMPLATE_LABELS,
  type PageTemplate,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function PageLayoutPicker({
  entryId,
  value,
  onChange,
}: {
  entryId: string;
  value: PageTemplate;
  onChange: (t: PageTemplate) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function pick(t: PageTemplate) {
    if (t === value || busy) return;
    setBusy(true);
    setError(null);
    onChange(t);
    const result = await updatePageTemplate(entryId, t);
    if (!result.ok) setError(result.error);
    setBusy(false);
  }

  return (
    <div className="border-border/80 bg-card/40 rounded-xl border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          Page layout{" "}
          <span className="text-muted-foreground font-normal">
            · {PAGE_TEMPLATE_LABELS[value]}
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          {open ? "Hide" : "Change"}
        </span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-white/10 px-3 pt-2 pb-3">
          <p className="text-muted-foreground text-xs">
            How this title looks on your entry page — separate from sharing.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAGE_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                disabled={busy}
                onClick={() => void pick(t)}
                className={cn(
                  "rounded-xl border p-2 text-left transition-all",
                  value === t
                    ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40"
                    : "border-border hover:border-amber-400/40",
                )}
              >
                <LayoutThumb kind={t} />
                <p className="mt-2 text-xs font-medium">
                  {PAGE_TEMPLATE_LABELS[t]}
                </p>
              </button>
            ))}
          </div>
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
      ) : null}
    </div>
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
