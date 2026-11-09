"use client";

import Link from "next/link";
import { useState } from "react";

import { ProgressControls } from "@/features/entries/progress-controls";
import { ShelfSectionHeading } from "@/features/shelf/shelf-panels";
import {
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function ContinueRail({
  entries: initial,
  tone = "default",
}: {
  entries: MediaEntry[];
  tone?: "default" | "shelf";
}) {
  const [entries, setEntries] = useState(initial);

  if (entries.length === 0) return null;

  const shelf = tone === "shelf";

  return (
    <section className={cn(shelf ? "space-y-2" : "space-y-4")}>
      {shelf ? (
        <ShelfSectionHeading
          title="Also in progress"
          subtitle="One tap +1 — keep the streak going"
          href="/library/"
        />
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div className="border-l-2 border-amber-400 pl-3">
            <h2 className="text-xl font-bold tracking-tight">
              Continue watching / reading
            </h2>
            <p className="text-muted-foreground text-sm">
              One tap +1 — keep the streak going
            </p>
          </div>
          <Link
            href="/library/"
            className="text-primary text-xs font-medium hover:underline"
          >
            See all
          </Link>
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "w-[min(100%,200px)] shrink-0 overflow-hidden rounded-xl border shadow-sm",
              shelf
                ? "border-[var(--shelf-border)] bg-[var(--shelf-surface)] shadow-sky-900/5"
                : "border-border/80 bg-card/50 shadow-md shadow-black/20",
            )}
          >
            <Link
              href={`/entries/view/?id=${entry.id}`}
              className={`relative block aspect-[16/9] overflow-hidden bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
            >
              {entry.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.cover_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2">
                <p className="text-[10px] font-medium tracking-wide text-white/80 uppercase">
                  {MEDIA_TYPE_LABELS[entry.media_type]}
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-xs leading-snug font-semibold text-white">
                  {entry.title}
                </h3>
              </div>
            </Link>
            <div
              className={cn(
                "p-2",
                shelf &&
                  "[&_[class*='border-border']]:border-[var(--shelf-border)] [&_[class*='shadow']]:shadow-none",
              )}
            >
              <ProgressControls
                entry={entry}
                compact
                onChange={(next) => {
                  setEntries((prev) =>
                    prev.map((e) => (e.id === next.id ? next : e)),
                  );
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
