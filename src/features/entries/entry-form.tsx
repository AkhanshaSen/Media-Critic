"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverPicker } from "@/features/entries/cover-picker";
import { RatingStars } from "@/features/entries/rating-stars";
import { StillsPicker } from "@/features/entries/stills-picker";
import {
  addEntryStills,
  createEntry,
  removeEntryBackdrop,
  removeEntryCover,
  setEntryBackdrop,
  setEntryCover,
  updateEntry,
} from "@/features/entries/data";
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
import { cn } from "@/lib/utils";

type EntryFormProps = {
  mode: "create" | "edit";
  entryId?: string;
  initial?: Partial<EntryFormValues> & {
    tags_text?: string;
    cover_url?: string | null;
    backdrop_url?: string | null;
    stills_count?: number;
  };
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
      initial?.progress_unit ??
      defaultProgressUnit(mediaType as EntryFormValues["media_type"]),
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

function fieldClass(invalid?: boolean) {
  return cn(
    invalid &&
      "border-destructive ring-3 ring-destructive/20 aria-invalid:border-destructive dark:border-destructive/50",
  );
}

function viewHref(id: string, justAdded: boolean) {
  return justAdded
    ? `/entries/view/?id=${id}&added=1`
    : `/entries/view/?id=${id}`;
}

export function EntryForm({ mode, entryId, initial }: EntryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState(() => defaults(initial));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.cover_url ?? null,
  );
  const [coverHint, setCoverHint] = useState<string | null>(null);
  const [removeExistingCover, setRemoveExistingCover] = useState(false);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(
    initial?.backdrop_url ?? null,
  );
  const [removeExistingBackdrop, setRemoveExistingBackdrop] = useState(false);
  const [stillFiles, setStillFiles] = useState<File[]>([]);

  const mediaType = String(values.media_type) as EntryFormValues["media_type"];
  const format = String(values.consumption_format) as ConsumptionFormat;
  const unit = (String(values.progress_unit) ||
    defaultProgressUnit(mediaType)) as ProgressUnit;
  const labels = useMemo(() => progressLabels(unit), [unit]);
  const showVolumes = format === "physical" || format === "mixed";
  const errorCount = Object.keys(fieldErrors).length;

  function clearError(name: string) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function setField(name: string, value: string | boolean) {
    clearError(name);
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

  function scrollToFirstInvalid() {
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[aria-invalid=true]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.();
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCoverHint(null);

    const parsed = entryFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setError(
        `${Object.keys(next).length} field${Object.keys(next).length === 1 ? "" : "s"} need attention.`,
      );
      scrollToFirstInvalid();
      return;
    }

    const missingCover =
      (!coverFile && (!coverPreview || removeExistingCover)) ||
      (removeExistingCover && !coverFile);
    if (missingCover) {
      setCoverHint(
        "No cover selected — your shelf will use a gradient placeholder. You can upload one later from Edit.",
      );
    }

    setFieldErrors({});
    startTransition(async () => {
      let id = entryId;

      if (mode === "create") {
        const result = await createEntry(parsed.data);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        id = result.data!.id;
      } else {
        if (!entryId) {
          setError("Missing entry id.");
          return;
        }
        const result = await updateEntry(entryId, parsed.data);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }

      if (id && removeExistingCover && !coverFile) {
        await removeEntryCover(id);
      }
      if (id && removeExistingBackdrop && !backdropFile) {
        await removeEntryBackdrop(id);
      }

      if (id && coverFile) {
        const coverResult = await setEntryCover(id, coverFile);
        if (!coverResult.ok) {
          setError(
            `Saved, but poster upload failed: ${coverResult.error}. You can retry from Edit.`,
          );
          router.push(viewHref(id, mode === "create"));
          return;
        }
      }

      if (id && backdropFile) {
        const backdropResult = await setEntryBackdrop(id, backdropFile);
        if (!backdropResult.ok) {
          setError(
            `Saved, but backdrop upload failed: ${backdropResult.error}. You can retry from Edit.`,
          );
          router.push(viewHref(id, mode === "create"));
          return;
        }
      }

      if (id && stillFiles.length > 0) {
        const stillsResult = await addEntryStills(id, stillFiles);
        if (!stillsResult.ok) {
          setError(
            `Saved, but some stills failed: ${stillsResult.error}. You can retry from Edit.`,
          );
          router.push(viewHref(id, mode === "create"));
          return;
        }
      }

      router.push(viewHref(id!, mode === "create"));
    });
  }

  function cancel() {
    if (mode === "edit" && entryId) {
      router.push(`/entries/view/?id=${entryId}`);
      return;
    }
    router.push("/library/");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-5"
      noValidate
    >
      {error ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          {error}
        </div>
      ) : null}

      <nav
        aria-label="Form sections"
        className="border-border/80 bg-card/50 sticky top-14 z-20 flex flex-wrap gap-1 rounded-xl border p-1 shadow-md shadow-black/20 backdrop-blur-md"
      >
        {(
          [
            ["form-images", "Images"],
            ["form-basics", "Basics"],
            ["form-progress", "Progress"],
            ["form-review", "Review"],
          ] as const
        ).map(([href, label]) => (
          <a
            key={href}
            href={`#${href}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      <section
        id="form-images"
        className="border-border scroll-mt-28 space-y-4 rounded-2xl border bg-card/40 p-4 shadow-lg shadow-black/10"
      >
        <h2 className="text-sm font-medium tracking-wide uppercase opacity-80">
          Images
        </h2>
        <div className="grid items-start gap-3 sm:grid-cols-[auto_1fr]">
          <CoverPicker
            aspect="poster"
            title="Poster (2:3)"
            description="Cards & entry cover · JPEG/PNG/WebP · 5 MB"
            previewUrl={
              coverFile
                ? coverPreview
                : removeExistingCover
                  ? null
                  : coverPreview
            }
            invalid={Boolean(fieldErrors.cover)}
            hint={coverHint}
            disabled={pending}
            onFile={(file) => {
              setCoverFile(file);
              setCoverHint(null);
              clearError("cover");
              if (file) {
                setRemoveExistingCover(false);
                const url = URL.createObjectURL(file);
                setCoverPreview(url);
              } else if (!removeExistingCover && initial?.cover_url) {
                setCoverPreview(initial.cover_url);
              } else {
                setCoverPreview(null);
              }
            }}
            onClearLocal={() => {
              setRemoveExistingCover(true);
              setCoverPreview(null);
            }}
          />
          <CoverPicker
            aspect="backdrop"
            title="Hero (16:9, optional)"
            description="Title backdrop · falls back to poster"
            previewUrl={
              backdropFile
                ? backdropPreview
                : removeExistingBackdrop
                  ? null
                  : backdropPreview
            }
            disabled={pending}
            onFile={(file) => {
              setBackdropFile(file);
              if (file) {
                setRemoveExistingBackdrop(false);
                setBackdropPreview(URL.createObjectURL(file));
              } else if (!removeExistingBackdrop && initial?.backdrop_url) {
                setBackdropPreview(initial.backdrop_url);
              } else {
                setBackdropPreview(null);
              }
            }}
            onClearLocal={() => {
              setRemoveExistingBackdrop(true);
              setBackdropPreview(null);
            }}
          />
        </div>
        <StillsPicker
          files={stillFiles}
          onChange={setStillFiles}
          existingCount={initial?.stills_count ?? 0}
          disabled={pending}
        />
      </section>

      <section
        id="form-basics"
        className="border-border scroll-mt-28 space-y-4 rounded-2xl border bg-card/40 p-4 shadow-lg shadow-black/10"
      >
        <h2 className="text-sm font-medium tracking-wide uppercase opacity-80">
          Basics
        </h2>
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={String(values.title)}
            onChange={(e) => setField("title", e.target.value)}
            required
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.title) || undefined}
            className={fieldClass(Boolean(fieldErrors.title))}
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
            aria-invalid={Boolean(fieldErrors.original_title) || undefined}
            className={fieldClass(Boolean(fieldErrors.original_title))}
          />
          {fieldErrors.original_title ? (
            <p className="text-destructive text-xs">
              {fieldErrors.original_title}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="media_type">Type</Label>
            <select
              id="media_type"
              className={cn(
                "border-input bg-background h-9 w-full rounded-md border px-3 text-sm",
                fieldClass(Boolean(fieldErrors.media_type)),
              )}
              value={String(values.media_type)}
              onChange={(e) => setField("media_type", e.target.value)}
              disabled={pending}
              aria-invalid={Boolean(fieldErrors.media_type) || undefined}
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
              className={cn(
                "border-input bg-background h-9 w-full rounded-md border px-3 text-sm",
                fieldClass(Boolean(fieldErrors.status)),
              )}
              value={String(values.status)}
              onChange={(e) => setField("status", e.target.value)}
              disabled={pending}
              aria-invalid={Boolean(fieldErrors.status) || undefined}
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
              aria-invalid={Boolean(fieldErrors.year) || undefined}
              className={fieldClass(Boolean(fieldErrors.year))}
            />
            {fieldErrors.year ? (
              <p className="text-destructive text-xs">{fieldErrors.year}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumption_format">Format</Label>
            <select
              id="consumption_format"
              className={cn(
                "border-input bg-background h-9 w-full rounded-md border px-3 text-sm",
                fieldClass(Boolean(fieldErrors.consumption_format)),
              )}
              value={String(values.consumption_format)}
              onChange={(e) => setField("consumption_format", e.target.value)}
              disabled={pending}
              aria-invalid={
                Boolean(fieldErrors.consumption_format) || undefined
              }
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

      <section
        id="form-progress"
        className="border-border scroll-mt-28 space-y-4 rounded-2xl border bg-card/40 p-4 shadow-lg shadow-black/10"
      >
        <h2 className="text-sm font-medium tracking-wide uppercase opacity-80">
          Progress
        </h2>
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
              aria-invalid={Boolean(fieldErrors.progress_current) || undefined}
              className={fieldClass(Boolean(fieldErrors.progress_current))}
            />
            {fieldErrors.progress_current ? (
              <p className="text-destructive text-xs">
                {fieldErrors.progress_current}
              </p>
            ) : null}
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
              aria-invalid={Boolean(fieldErrors.progress_total) || undefined}
              className={fieldClass(Boolean(fieldErrors.progress_total))}
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
            <DatePicker
              id="started_on"
              value={String(values.started_on)}
              onChange={(iso) => setField("started_on", iso)}
              disabled={pending}
              invalid={Boolean(fieldErrors.started_on)}
              placeholder="Start date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finished_on">Finished</Label>
            <DatePicker
              id="finished_on"
              value={String(values.finished_on)}
              onChange={(iso) => setField("finished_on", iso)}
              disabled={pending}
              invalid={Boolean(fieldErrors.finished_on)}
              placeholder="Finish date"
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
            aria-invalid={Boolean(fieldErrors.rating) || undefined}
            className={fieldClass(Boolean(fieldErrors.rating))}
          />
          {values.rating !== "" && values.rating != null ? (
            <RatingStars
              value={Number(values.rating)}
              size="md"
              variant="dark"
              showValue
            />
          ) : null}
          {fieldErrors.rating ? (
            <p className="text-destructive text-xs">{fieldErrors.rating}</p>
          ) : null}
        </div>
      </section>

      <section
        id="form-review"
        className="border-border scroll-mt-28 space-y-4 rounded-2xl border bg-card/40 p-4 shadow-lg shadow-black/10"
      >
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
            aria-invalid={Boolean(fieldErrors.verdict) || undefined}
            className={fieldClass(Boolean(fieldErrors.verdict))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review_title">Review title</Label>
          <Input
            id="review_title"
            value={String(values.review_title)}
            onChange={(e) => setField("review_title", e.target.value)}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.review_title) || undefined}
            className={fieldClass(Boolean(fieldErrors.review_title))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review_body">Review</Label>
          <Textarea
            id="review_body"
            rows={4}
            value={String(values.review_body)}
            onChange={(e) => setField("review_body", e.target.value)}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.review_body) || undefined}
            className={fieldClass(Boolean(fieldErrors.review_body))}
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

      <div className="flex flex-wrap items-center gap-3">
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
          onClick={cancel}
        >
          {mode === "edit" ? "Back to entry" : "Cancel"}
        </Button>
        {errorCount > 0 ? (
          <span className="text-destructive text-xs">
            {errorCount} field{errorCount === 1 ? "" : "s"} to fix
          </span>
        ) : null}
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
    cover_url: entry.cover_url,
    backdrop_url: entry.backdrop_url,
  };
}
