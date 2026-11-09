"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EntryImage } from "@/features/entries/cover-image";
import { DeleteEntryButton } from "@/features/entries/delete-entry-button";
import { EntryGallery } from "@/features/entries/entry-gallery";
import { ProgressControls } from "@/features/entries/progress-controls";
import {
  CONSUMPTION_FORMAT_LABELS,
  MEDIA_TYPE_GRADIENT,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  formatProgress,
  type MediaEntry,
  type PageTemplate,
} from "@/features/entries/schema";

export type EntryLayoutProps = {
  entry: MediaEntry;
  tags: string[];
  stills: EntryImage[];
  onEntryChange: Dispatch<SetStateAction<MediaEntry | null>>;
};

export function EntryLayoutByTemplate({
  template,
  ...props
}: EntryLayoutProps & { template: PageTemplate }) {
  if (template === "magazine") return <MagazineLayout {...props} />;
  if (template === "minimal") return <MinimalLayout {...props} />;
  return <CinematicLayout {...props} />;
}

function MetaPills({ entry }: { entry: MediaEntry }) {
  const format = entry.consumption_format ?? "digital";
  return (
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
  );
}

function ScoreBadge({ entry }: { entry: MediaEntry }) {
  return (
    <div className="rounded-2xl bg-amber-400 px-5 py-3 text-center shadow-lg shadow-amber-900/40">
      <p className="text-[10px] font-bold tracking-widest text-amber-950 uppercase">
        Score
      </p>
      <p className="text-3xl font-black text-amber-950 tabular-nums">
        {entry.rating != null ? entry.rating : "—"}
      </p>
    </div>
  );
}

function ActionButtons({ entryId }: { entryId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/entries/edit/?id=${entryId}`}
        className="inline-flex h-9 items-center rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white backdrop-blur hover:bg-white/15"
      >
        Edit
      </Link>
      <DeleteEntryButton entryId={entryId} />
    </div>
  );
}

function ReviewBlocks({
  entry,
  tags,
}: {
  entry: MediaEntry;
  tags: string[];
}) {
  return (
    <>
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
    </>
  );
}

function Sidebar({
  entry,
  onEntryChange,
}: {
  entry: MediaEntry;
  onEntryChange: Dispatch<SetStateAction<MediaEntry | null>>;
}) {
  return (
    <div className="space-y-4">
      <ProgressControls
        entry={entry}
        onChange={(next) => onEntryChange(next)}
      />
      <Card className="border-white/10 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p>Started: {entry.started_on ?? "—"}</p>
          <p>Finished: {entry.finished_on ?? "—"}</p>
          <p className="tabular-nums">Progress: {formatProgress(entry)}</p>
        </CardContent>
      </Card>
      <Link href="/library/" className="text-primary text-sm hover:underline">
        ← Back to library
      </Link>
    </div>
  );
}

/** Joker-style: full-bleed hero, score strip, long-form stack */
export function CinematicLayout({
  entry,
  tags,
  stills,
  onEntryChange,
}: EntryLayoutProps) {
  const heroUrl = entry.backdrop_url ?? entry.cover_url;
  const posterUrl = entry.cover_url;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section
        className={`relative min-h-[380px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 md:min-h-[460px] bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
      >
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${
              entry.backdrop_url ? "opacity-75" : "scale-110 opacity-40 blur-2xl"
            }`}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

        <div className="relative z-10 flex h-full min-h-[380px] flex-col justify-end gap-6 p-6 pb-8 md:min-h-[460px] md:flex-row md:items-end md:gap-8 md:p-10">
          <div className="shrink-0">
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt=""
                className="w-28 rounded-2xl object-cover shadow-2xl ring-1 ring-white/15 md:w-44"
              />
            ) : (
              <div className="bg-card/60 flex w-28 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 p-4 text-center md:w-44 md:min-h-[240px]">
                <p className="text-sm text-white/90">No poster</p>
                <Link
                  href={`/entries/edit/?id=${entry.id}`}
                  className="rounded-lg bg-white/15 px-3 py-1.5 text-xs"
                >
                  Upload
                </Link>
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <MetaPills entry={entry} />
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {entry.title}
            </h1>
            {entry.original_title ? (
              <p className="text-white/65 text-sm">{entry.original_title}</p>
            ) : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <ScoreBadge entry={entry} />
                <div className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white/80 backdrop-blur">
                  <p className="text-[10px] tracking-widest uppercase opacity-70">
                    Progress
                  </p>
                  <p className="font-semibold tabular-nums">
                    {formatProgress(entry)}
                  </p>
                </div>
              </div>
              <ActionButtons entryId={entry.id} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
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
          <ReviewBlocks entry={entry} tags={tags} />
        </div>
        <Sidebar entry={entry} onEntryChange={onEntryChange} />
      </div>
    </div>
  );
}

/** Book-detail: poster left, magazine copy right */
export function MagazineLayout({
  entry,
  tags,
  stills,
  onEntryChange,
}: EntryLayoutProps) {
  const posterUrl = entry.cover_url;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              className="w-full rounded-2xl object-cover shadow-2xl ring-1 ring-amber-400/20"
            />
          ) : (
            <div
              className={`aspect-[2/3] rounded-2xl bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
            />
          )}
          <ScoreBadge entry={entry} />
          <div className="text-muted-foreground space-y-1 border-y border-white/10 py-3 text-sm">
            <p>
              <span className="text-amber-300">Type</span>{" "}
              {MEDIA_TYPE_LABELS[entry.media_type]}
            </p>
            <p>
              <span className="text-amber-300">Status</span>{" "}
              {STATUS_LABELS[entry.status]}
            </p>
            {entry.year ? (
              <p>
                <span className="text-amber-300">Year</span> {entry.year}
              </p>
            ) : null}
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-amber-400/40 px-3 py-1 text-xs text-amber-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {MEDIA_TYPE_LABELS[entry.media_type]}
                {entry.year ? ` · ${entry.year}` : ""}
              </p>
              <h1 className="mt-1 font-serif text-4xl font-bold tracking-tight text-white md:text-5xl">
                {entry.title}
              </h1>
              {entry.original_title ? (
                <p className="text-sky-300 mt-2 text-sm">
                  {entry.original_title}
                </p>
              ) : null}
            </div>
            <ActionButtons entryId={entry.id} />
          </div>

          {entry.synopsis ? (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {entry.synopsis}
            </p>
          ) : null}

          <div className="space-y-3 border-t border-white/10 pt-4">
            <h2 className="text-lg font-semibold">What I thought</h2>
            {entry.verdict ? (
              <p className="text-xl text-amber-100/90 italic">{entry.verdict}</p>
            ) : null}
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {entry.review_body || "No review yet — add one from Edit."}
            </p>
          </div>

          <EntryGallery stills={stills} />
          <Sidebar entry={entry} onEntryChange={onEntryChange} />
        </div>
      </div>
    </div>
  );
}

/** Compact card stack */
export function MinimalLayout({
  entry,
  tags,
  stills,
  onEntryChange,
}: EntryLayoutProps) {
  const posterUrl = entry.cover_url;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Card className="overflow-hidden border-white/10 bg-card/60">
        <div className="flex gap-4 p-4">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              className="h-36 w-24 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div
              className={`h-36 w-24 shrink-0 rounded-xl bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
            />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <MetaPills entry={entry} />
            <h1 className="text-2xl font-bold tracking-tight">{entry.title}</h1>
            <p className="text-muted-foreground text-sm tabular-nums">
              {formatProgress(entry)}
              {entry.rating != null ? ` · Score ${entry.rating}` : ""}
            </p>
            <ActionButtons entryId={entry.id} />
          </div>
        </div>
      </Card>

      {entry.synopsis ? (
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Synopsis</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm whitespace-pre-wrap">
            {entry.synopsis}
          </CardContent>
        </Card>
      ) : null}

      <EntryGallery stills={stills} />
      <ReviewBlocks entry={entry} tags={tags} />
      <Sidebar entry={entry} onEntryChange={onEntryChange} />
    </div>
  );
}
