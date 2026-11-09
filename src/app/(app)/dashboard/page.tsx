"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContinueRail } from "@/features/entries/continue-rail";
import { countEntries, listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <PageHeader
        title="Your shelf"
        description="Private ratings, reviews, and fun progress tracking."
        action={
          <Link
            href="/add/"
            className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium shadow-md shadow-primary/20"
          >
            Add title
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-card/60 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle>On shelf</CardTitle>
            <CardDescription>All titles</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : (
              <p className="text-4xl font-semibold tabular-nums">
                {loading ? "…" : (count ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/60 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle>In progress</CardTitle>
            <CardDescription>Watching & reading</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tabular-nums">
              {loading ? "…" : continueList.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/60 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle>Finished</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tabular-nums">
              {loading ? "…" : completedThisMonth}
            </p>
          </CardContent>
        </Card>
      </div>

      {!loading && continueList.length > 0 ? (
        <ContinueRail entries={continueList} />
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Recently updated
          </h2>
          <Link
            href="/library/"
            className="text-primary text-xs font-medium hover:underline"
          >
            Browse library
          </Link>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="border-border rounded-2xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground text-sm">
              Nothing here yet. Add your first title and tap +1 as you go.
            </p>
            <Link
              href="/add/"
              className="bg-primary text-primary-foreground mt-4 inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium"
            >
              Add a title
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
