"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEntry, updateEntry } from "@/features/entries/data";
import {
  ENTRY_STATUSES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  entryFormSchema,
  type EntryFormValues,
  type MediaEntry,
} from "@/features/entries/schema";

type EntryFormProps = {
  mode: "create" | "edit";
  entryId?: string;
  initial?: Partial<EntryFormValues> & { tags_text?: string };
};

function defaults(
  initial?: EntryFormProps["initial"],
): Record<string, string | boolean> {
  return {
    title: initial?.title ?? "",
    original_title: initial?.original_title ?? "",
    media_type: initial?.media_type ?? "anime",
    year: initial?.year != null ? String(initial.year) : "",
    status: initial?.status ?? "plan_to_watch",
    progress_current: String(initial?.progress_current ?? 0),
    progress_total:
      initial?.progress_total != null ? String(initial.progress_total) : "",
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

  function setField(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
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
      <section className="border-border space-y-4 rounded-xl border bg-card/40 p-5">
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
          <Label htmlFor="original_title">Original / alternate title</Label>
          <Input
            id="original_title"
            value={String(values.original_title)}
            onChange={(e) => setField("original_title", e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="media_type">Media type</Label>
            <select
              id="media_type"
              className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              value={String(values.media_type)}
              onChange={(e) => setField("media_type", e.target.value)}
              disabled={pending}
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MEDIA_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              value={String(values.status)}
              onChange={(e) => setField("status", e.target.value)}
              disabled={pending}
            >
              {ENTRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
            <Label htmlFor="progress_current">Progress</Label>
            <Input
              id="progress_current"
              type="number"
              min={0}
              value={String(values.progress_current)}
              onChange={(e) => setField("progress_current", e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="progress_total">Total</Label>
            <Input
              id="progress_total"
              type="number"
              min={0}
              value={String(values.progress_total)}
              onChange={(e) => setField("progress_total", e.target.value)}
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

      <section className="border-border space-y-4 rounded-xl border bg-card/40 p-5">
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
    rating: entry.rating,
    review_title: entry.review_title ?? "",
    review_body: entry.review_body ?? "",
    verdict: entry.verdict ?? "",
    has_spoilers: entry.has_spoilers,
    tags_text: tags.join(", "),
  };
}
