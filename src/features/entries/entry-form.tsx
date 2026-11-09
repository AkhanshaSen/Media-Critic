"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEntry, updateEntry } from "@/features/entries/data";
import {
  CONSUMPTION_FORMATS,
  CONSUMPTION_FORMAT_LABELS,
  ENTRY_STATUSES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  PROGRESS_UNITS,
  STATUS_LABELS,
  defaultProgressUnit,
  entryFormSchema,
  progressLabels,
  type ConsumptionFormat,
  type EntryFormValues,
  type MediaEntry,
  type ProgressUnit,
} from "@/features/entries/schema";

type EntryFormProps = {
  mode: "create" | "edit";
  entryId?: string;
  initial?: Partial<EntryFormValues> & { tags_text?: string };
};

function defaults(
  initial?: EntryFormProps["initial"],
): Record<string, string | boolean> {
  const mediaType = initial?.media_type ?? "anime";
  return {
    title: initial?.title ?? "",
    original_title: initial?.original_title ?? "",
    media_type: mediaType,
    year: initial?.year != null ? String(initial.year) : "",
    status: initial?.status ?? "plan_to_watch",
    progress_current: String(initial?.progress_current ?? 0),
    progress_total:
      initial?.progress_total != null ? String(initial.progress_total) : "",
    progress_unit:
      initial?.progress_unit ?? defaultProgressUnit(mediaType as EntryFormValues["media_type"]),
    consumption_format: initial?.consumption_format ?? "digital",
    volume_current:
      initial?.volume_current != null ? String(initial.volume_current) : "",
    volume_total:
      initial?.volume_total != null ? String(initial.volume_total) : "",
    started_on: initial?.started_on ?? "",
    finished_on: initial?.finished_on ?? "",
    rating: initial?.rating != null ? String(initial.rating) : "",
    review_title: initial?.review_title ?? "",
    review_body: initial?.review_body ?? "",
    verdict: initial?.verdict ?? "",
    has_spoilers: Boolean(initial?.has_spoilers),
    tags_text: initial?.tags_text ?? "",
  };
}

export function EntryForm({ mode, entryId, initial }: EntryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState(() => defaults(initial));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mediaType = String(values.media_type) as EntryFormValues["media_type"];
  const format = String(values.consumption_format) as ConsumptionFormat;
  const unit = (String(values.progress_unit) ||
    defaultProgressUnit(mediaType)) as ProgressUnit;
  const labels = useMemo(() => progressLabels(unit), [unit]);
  const showVolumes = format === "physical" || format === "mixed";

  function setField(name: string, value: string | boolean) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "media_type" && typeof value === "string") {
        next.progress_unit = defaultProgressUnit(
          value as EntryFormValues["media_type"],
        );
        if (
          value === "manga" ||
          value === "manhwa" ||
          value === "manhua" ||
          value === "novel"
        ) {
          if (prev.status === "plan_to_watch" || prev.status === "watching") {
            next.status =
              prev.status === "watching" ? "reading" : "plan_to_read";
          }
        }
      }
      return next;
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = entryFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setError("Check the highlighted fields.");
      return;
    }

    startTransition(async () => {
      if (mode === "create") {
        const result = await createEntry(parsed.data);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/entries/view/?id=${result.data!.id}`);
        return;
      }

      if (!entryId) {
        setError("Missing entry id.");
        return;
      }

      const result = await updateEntry(entryId, parsed.data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/entries/view/?id=${entryId}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
    >
      <section className="border-border space-y-4 rounded-2xl border bg-card/40 p-5 shadow-lg shadow-black/10">
        <h2 className="text-sm font-medium tracking-wide uppercase opacity-80">
          Basics
        </h2>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={String(values.title)}
            onChange={(e) => setField("title", e.target.value)}
            required
            disabled={pending}
          />
          {fieldErrors.title ? (
            <p className="text-destructive text-xs">{fieldErrors.title}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="original_title">Original title</Label>
          <Input
            id="original_title"
            value={String(values.original_title)}
            onChange={(e) => setField("original_title", e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="media_type">Type</Label>
            <select
              id="media_type"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={String(values.media_type)}
              onChange={(e) => setField("media_type", e.target.value)}
              disabled={pending}
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MEDIA_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={String(values.status)}
              onChange={(e) => setField("status", e.target.value)}
              disabled={pending}
            >
              {ENTRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={String(values.year)}
              onChange={(e) => setField("year", e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumption_format">Format</Label>
            <select
              id="consumption_format"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={String(values.consumption_format)}
              onChange={(e) => setField("consumption_format", e.target.value)}
              disabled={pending}
            >
              {CONSUMPTION_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {CONSUMPTION_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="border-border space-y-4 rounded-2xl border bg-card/40 p-5 shadow-lg shadow-black/10">
        <h2 className="text-sm font-medium tracking-wide uppercase opacity-80">
          Progress
        </h2>
        <p className="text-muted-foreground text-xs">
          Track chapters for manga/books, episodes for anime. Physical copies can
          also log volume.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="progress_unit">Unit</Label>
            <select
              id="progress_unit"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={String(values.progress_unit)}
              onChange={(e) => setField("progress_unit", e.target.value)}
              disabled={pending}
            >
              {PROGRESS_UNITS.map((u) => (
                <option key={u} value={u}>
                  {progressLabels(u).current}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="progress_current">{labels.current}</Label>
            <Input
              id="progress_current"
              type="number"
              min={0}
              placeholder="e.g. 45"
              value={String(values.progress_current)}
              onChange={(e) => setField("progress_current", e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="progress_total">Total {labels.total}</Label>
            <Input
              id="progress_total"
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={String(values.progress_total)}
              onChange={(e) => setField("progress_total", e.target.value)}
              disabled={pending}
            />
          </div>
        </div>

        {showVolumes ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="volume_current">Volume</Label>
              <Input
                id="volume_current"
                type="number"
                min={0}
                placeholder="e.g. 3"
                value={String(values.volume_current)}
                onChange={(e) => setField("volume_current", e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume_total">Total volumes</Label>
              <Input
                id="volume_total"
                type="number"
                min={0}
                placeholder="e.g. 12"
                value={String(values.volume_total)}
                onChange={(e) => setField("volume_total", e.target.value)}
                disabled={pending}
              />
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="started_on">Started</Label>
            <Input
              id="started_on"
              type="date"
              value={String(values.started_on)}
              onChange={(e) => setField("started_on", e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finished_on">Finished</Label>
            <Input
              id="finished_on"
              type="date"
              value={String(values.finished_on)}
              onChange={(e) => setField("finished_on", e.target.value)}
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Rating (1–10)</Label>
          <Input
            id="rating"
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={String(values.rating)}
            onChange={(e) => setField("rating", e.target.value)}
            disabled={pending}
          />
          {fieldErrors.rating ? (
            <p className="text-destructive text-xs">{fieldErrors.rating}</p>
          ) : null}
        </div>
      </section>

      <section className="border-border space-y-4 rounded-2xl border bg-card/40 p-5 shadow-lg shadow-black/10">
        <h2 className="text-sm font-medium tracking-wide uppercase opacity-80">
          Review
        </h2>
        <div className="space-y-2">
          <Label htmlFor="verdict">One-line verdict</Label>
          <Input
            id="verdict"
            maxLength={120}
            value={String(values.verdict)}
            onChange={(e) => setField("verdict", e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review_title">Review title</Label>
          <Input
            id="review_title"
            value={String(values.review_title)}
            onChange={(e) => setField("review_title", e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review_body">Review</Label>
          <Textarea
            id="review_body"
            rows={6}
            value={String(values.review_body)}
            onChange={(e) => setField("review_body", e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags_text">Tags (comma-separated)</Label>
          <Input
            id="tags_text"
            placeholder="comfort watch, crying"
            value={String(values.tags_text)}
            onChange={(e) => setField("tags_text", e.target.value)}
            disabled={pending}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border"
            checked={Boolean(values.has_spoilers)}
            onChange={(e) => setField("has_spoilers", e.target.checked)}
            disabled={pending}
          />
          Contains spoilers
        </label>
      </section>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add to shelf"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function entryToFormInitial(
  entry: MediaEntry,
  tags: string[],
): EntryFormProps["initial"] {
  return {
    title: entry.title,
    original_title: entry.original_title ?? "",
    media_type: entry.media_type,
    year: entry.year,
    status: entry.status,
    progress_current: entry.progress_current,
    progress_total: entry.progress_total,
    progress_unit: entry.progress_unit ?? defaultProgressUnit(entry.media_type),
    consumption_format: entry.consumption_format ?? "digital",
    volume_current: entry.volume_current,
    volume_total: entry.volume_total,
    started_on: entry.started_on ?? "",
    finished_on: entry.finished_on ?? "",
    rating: entry.rating,
    review_title: entry.review_title ?? "",
    review_body: entry.review_body ?? "",
    verdict: entry.verdict ?? "",
    has_spoilers: entry.has_spoilers,
    tags_text: tags.join(", "),
  };
}
