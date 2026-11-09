"use client";

import Link from "next/link";

import { ProgressBar } from "@/features/entries/progress-bar";
import {
  CONSUMPTION_FORMAT_LABELS,
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  formatProgress,
  type MediaEntry,
} from "@/features/entries/schema";

export function EntryCard({ entry }: { entry: MediaEntry }) {
  const format = entry.consumption_format ?? "digital";

  return (
    <Link
      href={`/entries/view/?id=${entry.id}`}
      className="group border-border/80 bg-card/40 hover:border-primary/50 relative block overflow-hidden rounded-2xl border shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/10"
    >
      <div
        className={`relative flex h-36 flex-col justify-between bg-gradient-to-br p-4 ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="bg-background/75 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase backdrop-blur">
            {MEDIA_TYPE_LABELS[entry.media_type]}
          </span>
          {entry.rating != null ? (
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-xs font-bold text-amber-950 shadow-md tabular-nums">
              {entry.rating}
            </span>
          ) : null}
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide">
          <span className="bg-background/50 rounded-md px-1.5 py-0.5 backdrop-blur">
            {STATUS_LABELS[entry.status]}
          </span>
          <span className="bg-background/50 rounded-md px-1.5 py-0.5 backdrop-blur">
            {format === "digital" ? "🖥" : format === "physical" ? "📖" : "✦"}{" "}
            {CONSUMPTION_FORMAT_LABELS[format]}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="group-hover:text-primary line-clamp-2 text-base font-semibold leading-snug transition-colors">
            {entry.title}
          </h3>
          {entry.year ? (
            <p className="text-muted-foreground mt-1 text-xs">{entry.year}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground tabular-nums">
              {formatProgress(entry)}
            </span>
          </div>
          <ProgressBar entry={entry} />
        </div>
        {entry.verdict ? (
          <p className="text-muted-foreground line-clamp-2 text-sm italic">
            {entry.verdict}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
