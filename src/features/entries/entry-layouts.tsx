"use client";

import Link from "next/link";
import { useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";

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
import { MediaTypeBadge } from "@/features/entries/media-type-badge";
import { ProgressControls } from "@/features/entries/progress-controls";
import { RatingStars } from "@/features/entries/rating-stars";
import { SpoilerGate } from "@/features/entries/spoiler-guard";
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
  alwaysShowSpoilers?: boolean;
  accentStyle?: CSSProperties;
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
      <MediaTypeBadge type={entry.media_type} />
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
    <div className="rounded-xl bg-amber-400 px-3 py-2 shadow-md shadow-amber-900/30">
      <p className="text-[10px] font-bold tracking-widest text-amber-950 uppercase">
        Score
      </p>
      <div className="mt-0.5 flex items-center justify-center">
        <RatingStars
          value={entry.rating}
          size="md"
          variant="light"
          showValue
        />
      </div>
    </div>
  );
}

/** Interactive progress — same placement on every template (above review). */
function ProgressTrack({
  entry,
  onEntryChange,
}: {
  entry: MediaEntry;
  onEntryChange: Dispatch<SetStateAction<MediaEntry | null>>;
}) {
  return (
    <ProgressControls
      entry={entry}
      compact
      onChange={(next) => onEntryChange(next)}
    />
  );
}

function TimelineCard({ entry }: { entry: MediaEntry }) {
  return (
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
  );
}

function CollapsibleReviewBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = body.length > 320;
  const shown = !long || expanded ? body : `${body.slice(0, 320).trimEnd()}…`;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {shown}
      </p>
      {long ? (
        <button
          type="button"
          className="text-primary text-xs font-semibold hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

function ReviewBlocks({
  entry,
  tags,
  alwaysShowSpoilers = false,
}: {
  entry: MediaEntry;
  tags: string[];
  alwaysShowSpoilers?: boolean;
}) {
  const gate = entry.has_spoilers && !alwaysShowSpoilers;
  const [revealed, setRevealed] = useState(false);
  const hide = gate && !revealed;
  const body =
    entry.review_body || "No review yet — tap Edit above to write one.";

  return (
    <>
      <SpoilerGate
        active={gate}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
      />

      {!hide && entry.verdict ? (
        <Card className="border-white/10 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Verdict</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base italic">{entry.verdict}</p>
          </CardContent>
        </Card>
      ) : null}

      {!hide ? (
        <Card className="border-white/10 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {entry.review_title || "What I thought"}
            </CardTitle>
            {entry.has_spoilers ? (
              <CardDescription className="text-amber-700 dark:text-amber-200/90">
                Contains spoilers
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <CollapsibleReviewBody body={body} />
          </CardContent>
        </Card>
      ) : null}

      {tags.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Associated tags
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-800 dark:text-amber-200"
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

/** Joker-style: full-bleed hero, score strip, long-form stack */
export function CinematicLayout({
  entry,
  tags,
  stills,
  onEntryChange,
  alwaysShowSpoilers,
  accentStyle,
}: EntryLayoutProps) {
  const heroUrl = entry.backdrop_url ?? entry.cover_url;
  const posterUrl = entry.cover_url;

  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-4"
      style={accentStyle}
    >
      <section
        className={`relative min-h-[240px] overflow-hidden rounded-2xl border border-white/10 shadow-xl md:min-h-[280px] bg-gradient-to-br ${MEDIA_TYPE_GRADIENT[entry.media_type]}`}
        style={{
          boxShadow: `0 20px 40px -16px var(--entry-glow, rgb(0 0 0 / 0.45))`,
        }}
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

        <div className="relative z-10 flex h-full min-h-[240px] flex-col justify-end gap-4 p-4 pb-5 md:min-h-[280px] md:flex-row md:items-end md:gap-6 md:p-6">
          <div className="shrink-0">
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt=""
                className="w-20 rounded-xl object-cover shadow-lg ring-1 ring-white/15 sm:w-24 md:w-32"
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
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              {entry.title}
            </h1>
            {entry.original_title ? (
              <p className="text-white/65 text-sm">{entry.original_title}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <ScoreBadge entry={entry} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <ProgressTrack entry={entry} onEntryChange={onEntryChange} />
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
          <ReviewBlocks
            entry={entry}
            tags={tags}
            alwaysShowSpoilers={alwaysShowSpoilers}
          />
        </div>
        <div className="space-y-4">
          <TimelineCard entry={entry} />
          <DeleteEntryButton entryId={entry.id} />
        </div>
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
  alwaysShowSpoilers,
  accentStyle,
}: EntryLayoutProps) {
  const posterUrl = entry.cover_url;

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-8"
      style={accentStyle}
    >
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              className="w-full rounded-2xl object-cover shadow-2xl ring-1"
              style={{
                boxShadow: `0 0 0 1px var(--entry-accent, rgb(251 191 36 / 0.2))`,
              }}
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
          <DeleteEntryButton entryId={entry.id} />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {MEDIA_TYPE_LABELS[entry.media_type]}
              {entry.year ? ` · ${entry.year}` : ""}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white md:text-5xl">
              {entry.title}
            </h1>
            {entry.original_title ? (
              <p className="text-sky-300 mt-2 text-sm">{entry.original_title}</p>
            ) : null}
          </div>

          <ProgressTrack entry={entry} onEntryChange={onEntryChange} />
          <TimelineCard entry={entry} />

          {entry.synopsis ? (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {entry.synopsis}
            </p>
          ) : null}

          <ReviewBlocks
            entry={entry}
            tags={tags}
            alwaysShowSpoilers={alwaysShowSpoilers}
          />

          <EntryGallery stills={stills} />
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
  alwaysShowSpoilers,
  accentStyle,
}: EntryLayoutProps) {
  const posterUrl = entry.cover_url;

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-5"
      style={accentStyle}
    >
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
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              {entry.title}
            </h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              <span className="tabular-nums">{formatProgress(entry)}</span>
              {entry.rating != null ? (
                <>
                  <span aria-hidden>·</span>
                  <RatingStars
                    value={entry.rating}
                    size="sm"
                    variant="dark"
                    showValue
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <ProgressTrack entry={entry} onEntryChange={onEntryChange} />
      <TimelineCard entry={entry} />

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
      <ReviewBlocks
        entry={entry}
        tags={tags}
        alwaysShowSpoilers={alwaysShowSpoilers}
      />
      <DeleteEntryButton entryId={entry.id} />
    </div>
  );
}
