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
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Continue</h2>
          <p className="text-muted-foreground text-sm">
            One tap +1 — keep the streak going
          </p>
        </div>
        <Link
          href="/library/?status=watching"
          className="text-primary text-xs font-medium hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border-border/80 bg-card/50 w-[min(100%,280px)] shrink-0 overflow-hidden rounded-2xl border shadow-lg shadow-black/20"
          >
            <Link
              href={`/entries/view/?id=${entry.id}`}
              className={`block bg-gradient-to-br px-4 pt-4 pb-3 ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
            >
              <p className="text-[10px] font-medium tracking-wide uppercase opacity-80">
                {MEDIA_TYPE_LABELS[entry.media_type]}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                {entry.title}
              </h3>
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
