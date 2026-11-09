"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyShelfIllustration } from "@/components/layout/empty-shelf";
import { Skeleton } from "@/components/ui/skeleton";
import { ContinueRail } from "@/features/entries/continue-rail";
import { countEntries, listEntries } from "@/features/entries/data";
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

  const featured = useMemo(() => {
    return (
      entries.find((e) => e.cover_url) ??
      entries[0] ??
      null
    );
  }, [entries]);

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
      {/* Cinematic featured hero */}
      <section
        className={`relative min-h-[260px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40 md:min-h-[320px] ${
          featured
            ? `bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[featured.media_type]}`
            : "bg-gradient-to-br from-amber-500/20 via-card to-background"
        }`}
      >
        {featured?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={featured.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />

        <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-between gap-6 p-6 md:min-h-[320px] md:flex-row md:items-end md:p-8">
          <div className="flex min-w-0 flex-1 items-end gap-5">
            {featured?.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.cover_url}
                alt=""
                className="hidden w-28 shrink-0 rounded-2xl object-cover shadow-2xl shadow-black/50 ring-1 ring-white/10 sm:block md:w-36"
              />
            ) : null}
            <div className="min-w-0 space-y-3">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-300 uppercase">
                {featured ? "Featured on your shelf" : "Welcome"}
              </p>
              {featured ? (
                <>
                  <h1 className="line-clamp-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    {featured.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 text-[11px] tracking-wide text-white/75 uppercase">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">
                      {MEDIA_TYPE_LABELS[featured.media_type]}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">
                      {STATUS_LABELS[featured.status]}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur tabular-nums">
                      {formatProgress(featured)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/entries/view/?id=${featured.id}`}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold shadow-lg shadow-amber-900/30"
                    >
                      Open entry
                    </Link>
                    <Link
                      href="/add/"
                      className="border-white/20 bg-white/10 hover:bg-white/15 inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium text-white backdrop-blur"
                    >
                      Add title
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                    Your private shelf
                  </h1>
                  <p className="max-w-md text-sm text-white/70">
                    Track anime, movies, manga, and more — with covers, ratings,
                    and one-tap progress.
                  </p>
                  <Link
                    href="/add/"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold shadow-lg shadow-amber-900/30"
                  >
                    Add title
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Compact stat strip */}
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

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="border-l-2 border-amber-400 pl-3 text-xl font-bold tracking-tight">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyShelfIllustration
            title="Nothing on your shelf yet"
            description="Add a title with a cover poster, then tap +1 as you go."
          />
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
