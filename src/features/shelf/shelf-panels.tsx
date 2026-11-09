"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { bumpProgress } from "@/features/entries/data";
import {
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  formatProgress,
  type MediaEntry,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function ShelfSectionHeading({
  title,
  href,
  linkLabel = "See all",
  subtitle,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="shelf-accent-bar border-l-2 pl-3">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="shelf-muted text-xs">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shelf-link shrink-0 text-xs font-medium hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ShelfStatsRow({
  count,
  inProgress,
  finishedThisMonth,
  loading,
  error,
}: {
  count: number | null;
  inProgress: number;
  finishedThisMonth: number;
  loading: boolean;
  error: boolean;
}) {
  const cells = [
    {
      label: "On shelf",
      value: error ? "—" : loading ? "…" : String(count ?? 0),
    },
    {
      label: "In progress",
      value: loading ? "…" : String(inProgress),
    },
    {
      label: "Finished mo.",
      value: loading ? "…" : String(finishedThisMonth),
    },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-[var(--shelf-border)]">
      {cells.map((cell) => (
        <div key={cell.label} className="px-2 py-1 text-center sm:px-3">
          <p className="shelf-muted text-[10px] font-medium tracking-wide uppercase">
            {cell.label}
          </p>
          <p className="text-lg font-semibold tabular-nums tracking-tight sm:text-xl">
            {cell.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ShelfPickupRow({
  entry,
  onUpdated,
}: {
  entry: MediaEntry;
  onUpdated: (next: MediaEntry) => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div
        className={cn(
          "relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br sm:w-16",
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
      <div className="min-w-0 flex-1 space-y-1">
        <p className="shelf-muted text-[10px] font-semibold tracking-[0.14em] uppercase">
          Pick up where you left off
        </p>
        <p className="line-clamp-1 text-base font-bold tracking-tight sm:text-lg">
          {entry.title}
        </p>
        <div className="flex flex-wrap gap-1 text-[10px] tracking-wide uppercase">
          <span className="shelf-chip rounded-full px-2 py-0.5">
            {MEDIA_TYPE_LABELS[entry.media_type]}
          </span>
          <span className="shelf-chip rounded-full px-2 py-0.5">
            {STATUS_LABELS[entry.status]}
          </span>
          <span className="shelf-chip rounded-full px-2 py-0.5 tabular-nums">
            {formatProgress(entry)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Link
            href={`/entries/view/?id=${entry.id}`}
            className="shelf-cta inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold"
          >
            Open entry
          </Link>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shelf-outline h-8 min-w-12 rounded-full border text-xs font-semibold"
            disabled={
              pending ||
              (entry.progress_total != null &&
                entry.progress_current >= entry.progress_total)
            }
            onClick={() => {
              startTransition(async () => {
                const result = await bumpProgress(entry.id, 1);
                if (result.ok && result.data) {
                  onUpdated(result.data.entry);
                }
              });
            }}
          >
            +1
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ShelfWelcome() {
  return (
    <div className="space-y-2">
      <p className="text-base font-bold tracking-tight">Your private shelf</p>
      <p className="shelf-muted text-sm">
        Track anime, movies, manga, and more — with covers, ratings, and one-tap
        progress.
      </p>
      <Link
        href="/add/"
        className="shelf-cta inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold"
      >
        Add title
      </Link>
    </div>
  );
}
