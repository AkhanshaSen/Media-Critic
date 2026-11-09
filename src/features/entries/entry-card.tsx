"use client";

import Link from "next/link";

import { ProgressBar } from "@/features/entries/progress-bar";
import { RatingStars } from "@/features/entries/rating-stars";
import {
  CONSUMPTION_FORMAT_LABELS,
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  formatProgress,
  type MediaEntry,
} from "@/features/entries/schema";

const TYPE_DOT: Record<MediaEntry["media_type"], string> = {
  anime: "bg-violet-400",
  movie: "bg-rose-400",
  series: "bg-sky-400",
  manga: "bg-amber-400",
  manhwa: "bg-fuchsia-400",
  manhua: "bg-teal-400",
  novel: "bg-lime-400",
};

export function EntryCard({ entry }: { entry: MediaEntry }) {
  const format = entry.consumption_format ?? "digital";

  return (
    <Link
      href={`/entries/view/?id=${entry.id}`}
      className="group border-border/80 bg-card/40 hover:border-amber-400/40 relative block overflow-hidden rounded-2xl border shadow-lg shadow-black/30 transition-all hover:-translate-y-1 hover:shadow-amber-500/20"
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
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
          <span className="bg-background/80 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase backdrop-blur">
            <span
              className={`size-1.5 shrink-0 rounded-full ${TYPE_DOT[entry.media_type]}`}
              aria-hidden
            />
            {MEDIA_TYPE_LABELS[entry.media_type]}
          </span>
          {entry.rating != null ? (
            <span className="rounded-xl bg-amber-400 px-2 py-1 shadow-md">
              <RatingStars
                value={entry.rating}
                size="sm"
                variant="light"
                showValue
              />
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold text-white drop-shadow">
            {entry.title}
          </h3>
          <div className="flex flex-wrap gap-1.5 text-[10px] tracking-wide text-white/80 uppercase">
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
        <p className="line-clamp-2 border-t border-white/10 px-3 py-2.5 text-sm text-white/60 italic">
          {entry.verdict}
        </p>
      ) : null}
    </Link>
  );
}
