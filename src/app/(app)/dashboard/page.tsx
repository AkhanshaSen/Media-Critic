"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyShelfIllustration } from "@/components/layout/empty-shelf";
import { Skeleton } from "@/components/ui/skeleton";
import { ContinueRail } from "@/features/entries/continue-rail";
import { countEntries, listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
import {
  ShelfPickupRow,
  ShelfSectionHeading,
  ShelfStatsRow,
  ShelfWelcome,
} from "@/features/shelf/shelf-panels";
import type { MediaEntry } from "@/features/entries/schema";

export default function DashboardPage() {
  const [count, setCount] = useState<number | null>(null);
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  const railEntries = continueList.slice(1);

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
    <div className="shelf-page mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight font-[family-name:var(--font-display)] sm:text-2xl">
            Shelf
          </h1>
          <p className="shelf-muted text-xs sm:text-sm">
            What you&apos;re watching, reading, and revisiting
          </p>
        </div>
        <Link
          href="/add/"
          className="shelf-outline inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-xs font-semibold"
        >
          Add title
        </Link>
      </header>

      <section className="shelf-surface overflow-hidden rounded-2xl border shadow-sm shadow-sky-900/5">
        <div className="px-2.5 py-2.5 sm:px-3">
          <ShelfStatsRow
            count={count}
            inProgress={continueList.length}
            finishedThisMonth={completedThisMonth}
            loading={loading}
            error={Boolean(error)}
          />
        </div>

        {!loading ? (
          <>
            <div className="border-t border-[var(--shelf-border)]" />
            <div className="p-2.5 sm:p-3">
              {pickup ? (
                <ShelfPickupRow
                  entry={pickup}
                  onUpdated={(next) => {
                    setEntries((prev) =>
                      prev.map((e) => (e.id === next.id ? next : e)),
                    );
                  }}
                />
              ) : (
                <ShelfWelcome />
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2 border-t border-[var(--shelf-border)] p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
      </section>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {!loading && railEntries.length > 0 ? (
        <ContinueRail entries={railEntries} tone="shelf" />
      ) : null}

      <section className="space-y-2">
        <ShelfSectionHeading title="Recently updated" href="/library/" />
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyShelfIllustration
            variant="shelf"
            title="Nothing on your shelf yet"
            description="Add a title with a cover poster, then tap +1 as you go."
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                variant="compact"
                tone="shelf"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
