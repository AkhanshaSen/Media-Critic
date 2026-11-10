"use client";

import Link from "next/link";

import { ProgressBar } from "@/features/entries/progress-bar";
import { MediaTypeBadge } from "@/features/entries/media-type-badge";
import { RatingStars } from "@/features/entries/rating-stars";
import {
  CONSUMPTION_FORMAT_LABELS,
  MEDIA_TYPE_GRADIENT,
  STATUS_LABELS,
  formatProgress,
  type MediaEntry,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function EntryCard({
  entry,
  variant = "poster",
  tone = "default",
}: {
  entry: MediaEntry;
  variant?: "poster" | "compact";
  tone?: "default" | "shelf";
}) {
  const format = entry.consumption_format ?? "digital";
  const shelf = tone === "shelf";

  if (variant === "compact") {
    return (
      <Link
        href={`/entries/view/?id=${entry.id}`}
        className={cn(
          "flex gap-3 overflow-hidden rounded-[var(--r-lg)] border p-2",
          "transition-[border-color,box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          "hover:-translate-y-0.5",
          shelf
            ? "border-[var(--shelf-border)] bg-[var(--shelf-surface)] hover:border-[var(--shelf-accent)]"
            : "border-border bg-card hover:border-[color-mix(in_oklch,var(--accent),transparent_55%)]",
        )}
      >
        <div
          className={cn(
            "relative aspect-[2/3] w-[4.5rem] shrink-0 overflow-hidden rounded-[var(--r-sm)] bg-gradient-to-br",
            MEDIA_TYPE_GRADIENT[entry.media_type],
          )}
        >
          {entry.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.cover_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-[0.9rem] font-semibold tracking-tight">
              {entry.title}
            </h3>
            {entry.rating != null ? (
              <span className="shrink-0">
                <RatingStars
                  value={entry.rating}
                  size="sm"
                  variant="dark"
                  showValue
                />
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            <MediaTypeBadge type={entry.media_type} />
            <span className="rounded-[var(--r-sm)] bg-[var(--bg-sunken)] px-1.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-[var(--fg-muted)] uppercase">
              {STATUS_LABELS[entry.status]}
            </span>
            <span className="rounded-[var(--r-sm)] bg-[var(--bg-sunken)] px-1.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-[var(--fg-muted)] uppercase">
              {CONSUMPTION_FORMAT_LABELS[format]}
            </span>
          </div>
          <p className="font-mono text-[11px] tabular-nums text-[var(--fg-muted)]">
            {formatProgress(entry)}
          </p>
          <ProgressBar entry={entry} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/entries/view/?id=${entry.id}`}
      className={cn(
        "group border-border bg-card relative block overflow-hidden rounded-[var(--r-lg)] border",
        "transition-[border-color,box-shadow,transform] duration-150 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--accent),transparent_55%)] hover:shadow-md",
      )}
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
      >
        {entry.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute top-2 right-2 left-2 flex items-start justify-between gap-2">
          <MediaTypeBadge
            type={entry.media_type}
            className="bg-background/80 backdrop-blur"
          />
          {entry.rating != null ? (
            <span className="rounded-[var(--r-sm)] bg-primary px-1.5 py-0.5 shadow-sm">
              <RatingStars
                value={entry.rating}
                size="sm"
                variant="light"
                showValue
              />
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-2.5">
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-white drop-shadow">
            {entry.title}
          </h3>
          <div className="flex flex-wrap gap-1 text-[0.6875rem] font-medium tracking-wide text-white/80 uppercase">
            <span className="rounded-[var(--r-sm)] bg-white/15 px-1.5 py-0.5 backdrop-blur">
              {STATUS_LABELS[entry.status]}
            </span>
            <span className="rounded-[var(--r-sm)] bg-white/15 px-1.5 py-0.5 backdrop-blur">
              {CONSUMPTION_FORMAT_LABELS[format]}
            </span>
            {entry.year ? (
              <span className="rounded-[var(--r-sm)] bg-white/15 px-1.5 py-0.5 backdrop-blur">
                {entry.year}
              </span>
            ) : null}
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-white/80 tabular-nums">
              {formatProgress(entry)}
            </p>
            <ProgressBar entry={entry} className="bg-white/20" />
          </div>
        </div>
      </div>
      {entry.verdict ? (
        <p className="line-clamp-2 border-t border-[var(--border-soft)] px-2.5 py-2 text-xs text-[var(--fg-muted)] italic">
          {entry.verdict}
        </p>
      ) : null}
    </Link>
  );
}
