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
      className="group border-border/80 bg-card/40 hover:border-primary/50 relative block overflow-hidden rounded-2xl border shadow-lg shadow-black/30 transition-all hover:-translate-y-1 hover:shadow-primary/15"
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
      >
        {entry.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="bg-background/80 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase backdrop-blur">
            {MEDIA_TYPE_LABELS[entry.media_type]}
          </span>
          {entry.rating != null ? (
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-xs font-bold text-amber-950 shadow-md tabular-nums">
              {entry.rating}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white drop-shadow">
            {entry.title}
          </h3>
          <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide text-white/80">
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 backdrop-blur">
              {STATUS_LABELS[entry.status]}
            </span>
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 backdrop-blur">
              {CONSUMPTION_FORMAT_LABELS[format]}
            </span>
            {entry.year ? (
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 backdrop-blur">
                {entry.year}
              </span>
            ) : null}
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-white/80 tabular-nums">
              {formatProgress(entry)}
            </p>
            <ProgressBar entry={entry} className="bg-white/20" />
          </div>
        </div>
      </div>
      {entry.verdict ? (
        <p className="text-muted-foreground line-clamp-2 px-3 py-2.5 text-sm italic">
          {entry.verdict}
        </p>
      ) : null}
    </Link>
  );
}
