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
        "bg-muted/80 h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct ?? entry.progress_current}
      aria-valuemin={0}
      aria-valuemax={entry.progress_total ?? undefined}
    >
      <div
        className={cn(
          "from-primary to-amber-400/90 h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out",
          pulse && "animate-pulse",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
