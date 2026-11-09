"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countEntries, listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
import type { MediaEntry } from "@/features/entries/schema";

export default function DashboardPage() {
  const [count, setCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<MediaEntry[]>([]);
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
      setRecent(list.slice(0, 6));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title="Your shelf"
        description="Private ratings and reviews, signed in with Google."
        action={
          <Link
            href="/add/"
            className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium"
          >
            Add title
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle>Titles on shelf</CardTitle>
            <CardDescription>Your private count</CardDescription>
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
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump in</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/library/" className="hover:text-primary underline">
              Browse library
            </Link>
            <Link href="/add/" className="hover:text-primary underline">
              Add a title with rating & review
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recently updated</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing here yet. Add your first title.
          </p>
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
