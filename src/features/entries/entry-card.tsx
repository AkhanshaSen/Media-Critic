import Link from "next/link";

import {
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";

export function EntryCard({ entry }: { entry: MediaEntry }) {
  return (
    <Link
      href={`/entries/view/?id=${entry.id}`}
      className="group border-border bg-card/50 hover:border-primary/40 block overflow-hidden rounded-xl border transition-colors"
    >
      <div className="from-primary/20 via-muted to-background flex h-28 items-end bg-gradient-to-br p-4">
        <span className="bg-background/80 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase backdrop-blur">
          {MEDIA_TYPE_LABELS[entry.media_type]}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="group-hover:text-primary line-clamp-2 text-base font-semibold leading-snug transition-colors">
          {entry.title}
        </h3>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          {entry.year ? <span>{entry.year}</span> : null}
          <span className="bg-muted rounded-md px-1.5 py-0.5">
            {STATUS_LABELS[entry.status]}
          </span>
          {entry.rating != null ? (
            <span className="text-foreground rounded-md bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-200 tabular-nums">
              {entry.rating}/10
            </span>
          ) : (
            <span>Unrated</span>
          )}
        </div>
        {entry.verdict ? (
          <p className="text-muted-foreground line-clamp-2 text-sm italic">
            {entry.verdict}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
