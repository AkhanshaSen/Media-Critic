"use client";

import Link from "next/link";
import { useState } from "react";

import { ProgressControls } from "@/features/entries/progress-controls";
import {
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";

export function ContinueRail({
  entries: initial,
}: {
  entries: MediaEntry[];
}) {
  const [entries, setEntries] = useState(initial);

  if (entries.length === 0) return null;

  return (
    <section className="space-y-4">
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
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border-border/80 bg-card/50 w-[min(100%,320px)] shrink-0 overflow-hidden rounded-2xl border shadow-lg shadow-black/20"
          >
            <Link
              href={`/entries/view/?id=${entry.id}`}
              className={`relative block aspect-[16/10] overflow-hidden bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
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
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-[10px] font-medium tracking-wide text-white/80 uppercase">
                  {MEDIA_TYPE_LABELS[entry.media_type]}
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white">
                  {entry.title}
                </h3>
              </div>
            </Link>
            <div className="p-3">
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
