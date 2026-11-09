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
import {
  getEntry,
  getEntryTags,
  listEntryImages,
  type EntryImage,
} from "@/features/entries/data";
import { DeleteEntryButton } from "@/features/entries/delete-entry-button";
import { EntryGallery } from "@/features/entries/entry-gallery";
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
  const [stills, setStills] = useState<EntryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (!id) {
        setEntry(null);
        setStills([]);
        setLoading(false);
        return;
      }
      const [e, t, images] = await Promise.all([
        getEntry(id),
        getEntryTags(id),
        listEntryImages(id),
      ]);
      if (cancelled) return;
      setEntry(e);
      setTags(t);
      setStills(images.filter((img) => img.role === "still"));
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
  const heroUrl = entry.backdrop_url ?? entry.cover_url;
  const posterUrl = entry.cover_url;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Cinematic hero — backdrop (or poster fallback) as wide image */}
      <section
        className={`relative min-h-[340px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 md:min-h-[400px] bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
      >
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${
              entry.backdrop_url
                ? "opacity-70"
                : "scale-110 opacity-35 blur-3xl"
            }`}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />

        <div className="relative z-10 flex h-full min-h-[340px] flex-col justify-end gap-6 p-6 pb-8 md:min-h-[400px] md:flex-row md:items-end md:gap-8 md:p-10">
          <div className="shrink-0">
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt=""
                className="w-28 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/15 md:w-44"
              />
            ) : (
              <div className="bg-card/60 flex w-28 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 p-4 text-center shadow-2xl md:w-44 md:min-h-[260px]">
                <p className="text-sm font-medium text-white/90">No poster yet</p>
                <Link
                  href={`/entries/edit/?id=${entry.id}`}
                  className="bg-background/80 hover:bg-background rounded-lg px-3 py-1.5 text-xs font-medium backdrop-blur"
                >
                  Upload poster
                </Link>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-[11px] font-medium tracking-wide uppercase">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur">
                  {MEDIA_TYPE_LABELS[entry.media_type]}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur">
                  {STATUS_LABELS[entry.status]}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur">
                  {CONSUMPTION_FORMAT_LABELS[format]}
                </span>
                {entry.year ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur">
                    {entry.year}
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {entry.title}
              </h1>
              {entry.original_title ? (
                <p className="text-sm text-white/65">{entry.original_title}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="rounded-2xl bg-amber-400 px-5 py-3 text-center shadow-lg shadow-amber-900/40">
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
                  className="inline-flex h-9 items-center rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white backdrop-blur hover:bg-white/15"
                >
                  Edit
                </Link>
                <DeleteEntryButton entryId={entry.id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {entry.synopsis ? (
            <Card className="border-white/10 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Synopsis</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {entry.synopsis}
              </CardContent>
            </Card>
          ) : null}

          <EntryGallery stills={stills} />

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
                {entry.review_title || "What I thought"}
              </CardTitle>
              {entry.has_spoilers ? (
                <CardDescription className="text-amber-200/90">
                  Contains spoilers
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {entry.review_body || "No review yet — add one from Edit."}
            </CardContent>
          </Card>

          {tags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Associated tags
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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
