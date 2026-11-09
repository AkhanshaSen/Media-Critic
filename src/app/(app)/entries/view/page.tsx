"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntry, getEntryTags } from "@/features/entries/data";
import { DeleteEntryButton } from "@/features/entries/delete-entry-button";
import { ProgressControls } from "@/features/entries/progress-controls";
import {
  CONSUMPTION_FORMAT_LABELS,
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";

export default function EntryViewPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
    >
      <EntryViewContent />
    </Suspense>
  );
}

function EntryViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [entry, setEntry] = useState<MediaEntry | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (!id) {
        setEntry(null);
        setLoading(false);
        return;
      }
      const [e, t] = await Promise.all([getEntry(id), getEntryTags(id)]);
      if (cancelled) return;
      setEntry(e);
      setTags(t);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (!entry) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Entry not found.</p>
        <Link href="/library/" className="underline">
          Back to library
        </Link>
      </div>
    );
  }

  const format = entry.consumption_format ?? "digital";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-6 shadow-2xl shadow-black/40 md:p-8 ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[11px] font-medium tracking-wide uppercase">
              <span className="bg-background/70 rounded-full px-2.5 py-1 backdrop-blur">
                {MEDIA_TYPE_LABELS[entry.media_type]}
              </span>
              <span className="bg-background/70 rounded-full px-2.5 py-1 backdrop-blur">
                {STATUS_LABELS[entry.status]}
              </span>
              <span className="bg-background/70 rounded-full px-2.5 py-1 backdrop-blur">
                {CONSUMPTION_FORMAT_LABELS[format]}
              </span>
              {entry.year ? (
                <span className="bg-background/70 rounded-full px-2.5 py-1 backdrop-blur">
                  {entry.year}
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {entry.title}
            </h1>
            {entry.original_title ? (
              <p className="text-muted-foreground text-sm">
                {entry.original_title}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="rounded-2xl bg-amber-400 px-5 py-3 text-center shadow-lg shadow-amber-900/30">
              <p className="text-[10px] font-bold tracking-widest text-amber-950 uppercase">
                Score
              </p>
              <p className="text-3xl font-black text-amber-950 tabular-nums">
                {entry.rating != null ? entry.rating : "—"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/entries/edit/?id=${entry.id}`}
                className="border-border bg-background/60 hover:bg-background/80 inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium backdrop-blur"
              >
                Edit
              </Link>
              <DeleteEntryButton entryId={entry.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {entry.verdict ? (
            <Card className="border-white/10 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Verdict</CardTitle>
              </CardHeader>
              <CardContent className="text-lg italic">{entry.verdict}</CardContent>
            </Card>
          ) : null}

          <Card className="border-white/10 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">
                {entry.review_title || "Review"}
              </CardTitle>
              {entry.has_spoilers ? (
                <CardDescription className="text-amber-200/90">
                  Contains spoilers
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {entry.review_body || "No review yet — add one from Edit."}
            </CardContent>
          </Card>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted rounded-full px-2.5 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <ProgressControls entry={entry} onChange={setEntry} />
          <Card className="border-white/10 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p>Started: {entry.started_on ?? "—"}</p>
              <p>Finished: {entry.finished_on ?? "—"}</p>
            </CardContent>
          </Card>
          <Link
            href="/library/"
            className="text-primary text-sm hover:underline"
          >
            ← Back to library
          </Link>
        </div>
      </div>
    </div>
  );
}
