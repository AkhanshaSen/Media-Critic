"use client";

import { cn } from "@/lib/utils";
import { progressPercent, type MediaEntry } from "@/features/entries/schema";

export function ProgressBar({
  entry,
  className,
  pulse,
}: {
  entry: Pick<MediaEntry, "progress_current" | "progress_total">;
  className?: string;
  pulse?: boolean;
}) {
  const pct = progressPercent(entry);
  const width = pct ?? (entry.progress_current > 0 ? 8 : 0);

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct ?? entry.progress_current}
      aria-valuemin={0}
      aria-valuemax={entry.progress_total ?? undefined}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary",
          "transition-[width] duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
          pulse &&
            "bg-[linear-gradient(90deg,var(--accent)_25%,color-mix(in_oklch,var(--accent),white_35%)_50%,var(--accent)_75%)] bg-[length:200%_100%] motion-safe:animate-[shimmer_1.2s_ease-in-out_infinite]",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
