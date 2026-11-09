"use client";

import { paceStats, type MediaEntry } from "@/features/entries/schema";

export function ProgressPace({
  entry,
}: {
  entry: Pick<
    MediaEntry,
    | "started_on"
    | "finished_on"
    | "progress_current"
    | "progress_total"
    | "progress_unit"
    | "media_type"
  >;
}) {
  const stats = paceStats(entry);

  if (!entry.started_on && !entry.finished_on) {
    return (
      <p className="text-muted-foreground text-xs">
        Hit +1 to start the clock — we&apos;ll track how long this takes.
      </p>
    );
  }

  const parts: string[] = [];
  if (stats.daysElapsed != null) {
    parts.push(
      entry.finished_on
        ? `Finished in ${stats.daysElapsed} day${stats.daysElapsed === 1 ? "" : "s"}`
        : `Day ${stats.daysElapsed}`,
    );
  }
  if (stats.ratePerWeek != null && !entry.finished_on) {
    parts.push(`~${stats.ratePerWeek} ${stats.unitLabel}`);
  }
  if (stats.daysLeft != null) {
    parts.push(`~${stats.daysLeft} day${stats.daysLeft === 1 ? "" : "s"} left`);
  }

  return (
    <p className="text-muted-foreground text-xs leading-relaxed">
      {parts.join(" · ")}
      {entry.started_on ? (
        <span className="mt-0.5 block opacity-70">
          Started {entry.started_on}
          {entry.finished_on ? ` · Done ${entry.finished_on}` : ""}
        </span>
      ) : null}
    </p>
  );
}
