"use client";

import {
  SHARE_TEMPLATE_LABELS,
  type MediaEntry,
  type ShareTemplate,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function ShareCardPreview({
  entry,
  template,
  selected,
  onSelect,
}: {
  entry: MediaEntry;
  template: ShareTemplate;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full overflow-hidden rounded-xl border text-left transition-all",
        selected
          ? "border-amber-400 ring-2 ring-amber-400/40"
          : "border-white/10 hover:border-amber-400/40",
      )}
    >
      <div className="border-b border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium tracking-wide text-amber-200/90 uppercase">
        {SHARE_TEMPLATE_LABELS[template]}
      </div>
      {template === "minimal_dark" ? (
        <MinimalDarkCard entry={entry} />
      ) : template === "poster_score" ? (
        <PosterScoreCard entry={entry} />
      ) : (
        <VerdictQuoteCard entry={entry} />
      )}
    </button>
  );
}

function MinimalDarkCard({ entry }: { entry: MediaEntry }) {
  return (
    <div className="space-y-2 bg-[#0b0b0f] p-3">
      <p className="text-[10px] tracking-widest text-white/50 uppercase">
        Media Critic
      </p>
      <p className="line-clamp-2 text-sm font-semibold text-white">
        {entry.title}
      </p>
      <p className="text-amber-400 text-lg font-black tabular-nums">
        {entry.rating != null ? entry.rating : "—"}
        <span className="text-white/40 text-xs font-normal"> / 10</span>
      </p>
    </div>
  );
}

function PosterScoreCard({ entry }: { entry: MediaEntry }) {
  return (
    <div className="relative flex min-h-28 items-end overflow-hidden bg-[#111]">
      {entry.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.cover_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-black" />
      )}
      <div className="relative z-10 flex w-full items-end justify-between gap-2 bg-gradient-to-t from-black via-black/70 to-transparent p-3">
        <p className="line-clamp-2 text-xs font-semibold text-white">
          {entry.title}
        </p>
        <span className="shrink-0 rounded-md bg-amber-400 px-2 py-1 text-xs font-black text-amber-950 tabular-nums">
          {entry.rating != null ? entry.rating : "—"}
        </span>
      </div>
    </div>
  );
}

function VerdictQuoteCard({ entry }: { entry: MediaEntry }) {
  return (
    <div className="space-y-2 bg-[#121018] p-3">
      <p className="line-clamp-1 text-[11px] font-medium text-white/70">
        {entry.title}
      </p>
      <p className="line-clamp-3 text-sm text-amber-100/90 italic">
        “{entry.verdict || entry.review_body || "No verdict yet."}”
      </p>
    </div>
  );
}

export function buildShareText(entry: MediaEntry): string {
  const parts = [
    entry.title,
    entry.rating != null ? `Score: ${entry.rating}/10` : null,
    entry.verdict ? `Verdict: ${entry.verdict}` : null,
    entry.review_body ? entry.review_body.slice(0, 400) : null,
    "— via Media Critic",
  ].filter(Boolean);
  return parts.join("\n");
}
