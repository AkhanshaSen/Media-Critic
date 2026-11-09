"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { bumpProgress } from "@/features/entries/data";
import { ProgressBar } from "@/features/entries/progress-bar";
import { ProgressPace } from "@/features/entries/progress-pace";
import {
  formatProgress,
  progressLabels,
  resolveProgressUnit,
  type MediaEntry,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function ProgressControls({
  entry,
  onChange,
  compact = false,
}: {
  entry: MediaEntry;
  onChange?: (entry: MediaEntry) => void;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [pulse, setPulse] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<MediaEntry | null>(null);

  const display = optimistic?.id === entry.id ? optimistic : entry;
  const unit = resolveProgressUnit(display);
  const labels = progressLabels(unit);

  function bump(delta: number) {
    setError(null);
    startTransition(async () => {
      const result = await bumpProgress(entry.id, delta);
      if (!result.ok || !result.data) {
        setError(result.ok ? "Update failed." : result.error);
        return;
      }
      setOptimistic(result.data.entry);
      onChange?.(result.data.entry);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 600);
      if (result.data.justCompleted) {
        setBanner("Finished! Marked completed.");
        window.setTimeout(() => setBanner(null), 3500);
      }
    });
  }

  return (
    <div
      className={cn(
        "border-border/80 bg-card/50 space-y-3 rounded-2xl border p-4 shadow-lg shadow-black/20",
        compact && "p-3",
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {labels.current}
          </p>
          <p className="text-lg font-semibold tabular-nums tracking-tight">
            {formatProgress(display)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-10 rounded-full"
            disabled={pending || display.progress_current <= 0}
            onClick={() => bump(-1)}
            aria-label="Decrease progress"
          >
            −1
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-w-14 rounded-full font-semibold shadow-md shadow-primary/25"
            disabled={
              pending ||
              (display.progress_total != null &&
                display.progress_current >= display.progress_total)
            }
            onClick={() => bump(1)}
            aria-label="Increase progress"
          >
            +1
          </Button>
        </div>
      </div>

      <ProgressBar entry={display} pulse={pulse} />
      {!compact ? <ProgressPace entry={display} /> : null}

      {banner ? (
        <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-100">
          {banner}
        </p>
      ) : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
