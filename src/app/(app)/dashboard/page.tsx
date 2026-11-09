"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { EmptyShelfIllustration } from "@/components/layout/empty-shelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContinueRail } from "@/features/entries/continue-rail";
import { bumpProgress, countEntries, listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
import {
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  formatProgress,
  type MediaEntry,
} from "@/features/entries/schema";

export default function DashboardPage() {
  const [count, setCount] = useState<number | null>(null);
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bumpPending, startBump] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [c, list] = await Promise.all([
        countEntries(),
        listEntries({ sort: "updated" }),
      ]);
      if (cancelled) return;
      if (c === null) {
        setError(
          "Could not read the shelf. Run the auth RLS SQL migration and confirm you are signed in.",
        );
      }
      setCount(c);
      setEntries(list);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const continueList = useMemo(
    () =>
      entries
        .filter((e) => e.status === "watching" || e.status === "reading")
        .slice(0, 8),
    [entries],
  );

  const pickup = continueList[0] ?? null;

  const recent = useMemo(() => entries.slice(0, 6), [entries]);

  const completedThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return entries.filter((e) => {
      if (!e.finished_on) return false;
      const d = new Date(`${e.finished_on}T00:00:00`);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [entries]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {!loading && pickup ? (
        <section className="border-border/80 bg-card/50 flex flex-col gap-3 rounded-2xl border p-3 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
          <div
            className={`relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br sm:w-20 ${MEDIA_TYPE_GRADIENT[pickup.media_type]}`}
          >
            {pickup.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pickup.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300/90">
              Pick up where you left off
            </p>
            <h1 className="line-clamp-1 text-lg font-bold tracking-tight sm:text-xl">
              {pickup.title}
            </h1>
            <div className="text-muted-foreground flex flex-wrap gap-1.5 text-[10px] tracking-wide uppercase">
              <span className="bg-muted rounded-full px-2 py-0.5">
                {MEDIA_TYPE_LABELS[pickup.media_type]}
              </span>
              <span className="bg-muted rounded-full px-2 py-0.5">
                {STATUS_LABELS[pickup.status]}
              </span>
              <span className="bg-muted rounded-full px-2 py-0.5 tabular-nums">
                {formatProgress(pickup)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={`/entries/view/?id=${pickup.id}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold"
              >
                Open entry
              </Link>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-w-14 rounded-full font-semibold"
                disabled={
                  bumpPending ||
                  (pickup.progress_total != null &&
                    pickup.progress_current >= pickup.progress_total)
                }
                onClick={() => {
                  startBump(async () => {
                    const result = await bumpProgress(pickup.id, 1);
                    if (result.ok && result.data) {
                      setEntries((prev) =>
                        prev.map((e) =>
                          e.id === result.data!.entry.id
                            ? result.data!.entry
                            : e,
                        ),
                      );
                    }
                  });
                }}
              >
                +1
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && !pickup ? (
        <section className="border-border/80 bg-card/40 space-y-2 rounded-2xl border p-4">
          <h1 className="text-xl font-bold tracking-tight">Your private shelf</h1>
          <p className="text-muted-foreground text-sm">
            Track anime, movies, manga, and more — with covers, ratings, and
            one-tap progress.
          </p>
          <Link
            href="/add/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold"
          >
            Add title
          </Link>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="bg-card/50 border-border/60 flex items-baseline gap-2 rounded-full border px-4 py-2 text-sm shadow-md shadow-black/20">
          <span className="text-muted-foreground">On your shelf</span>
          <span className="text-lg font-semibold tabular-nums">
            {error ? "—" : loading ? "…" : (count ?? 0)}
          </span>
        </div>
        <div className="bg-card/50 border-border/60 flex items-baseline gap-2 rounded-full border px-4 py-2 text-sm shadow-md shadow-black/20">
          <span className="text-muted-foreground">In progress</span>
          <span className="text-lg font-semibold tabular-nums">
            {loading ? "…" : continueList.length}
          </span>
        </div>
        <div className="bg-card/50 border-border/60 flex items-baseline gap-2 rounded-full border px-4 py-2 text-sm shadow-md shadow-black/20">
          <span className="text-muted-foreground">Finished this month</span>
          <span className="text-lg font-semibold tabular-nums">
            {loading ? "…" : completedThisMonth}
          </span>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {!loading && continueList.length > 0 ? (
        <ContinueRail entries={continueList} />
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="border-l-2 border-amber-400 pl-3 text-lg font-bold tracking-tight">
            Recently updated
          </h2>
          <Link
            href="/library/"
            className="text-primary shrink-0 text-xs font-medium hover:underline"
          >
            See all
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyShelfIllustration
            title="Nothing on your shelf yet"
            description="Add a title with a cover poster, then tap +1 as you go."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((entry) => (
              <EntryCard key={entry.id} entry={entry} variant="compact" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
