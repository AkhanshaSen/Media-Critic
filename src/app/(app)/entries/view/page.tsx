"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntry, getEntryTags } from "@/features/entries/data";
import { DeleteEntryButton } from "@/features/entries/delete-entry-button";
import {
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title={entry.title}
        description={`${MEDIA_TYPE_LABELS[entry.media_type]}${entry.year ? ` · ${entry.year}` : ""}${entry.original_title ? ` · ${entry.original_title}` : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/entries/edit/?id=${entry.id}`}
              className="border-border hover:bg-muted inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium"
            >
              Edit
            </Link>
            <DeleteEntryButton entryId={entry.id} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Rating</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {entry.rating != null ? `${entry.rating}/10` : "—"}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>{STATUS_LABELS[entry.status]}</CardContent>
        </Card>
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {entry.progress_current}
            {entry.progress_total != null ? ` / ${entry.progress_total}` : ""}
          </CardContent>
        </Card>
      </div>

      {entry.verdict ? (
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Verdict</CardTitle>
          </CardHeader>
          <CardContent className="italic">{entry.verdict}</CardContent>
        </Card>
      ) : null}

      <Card className="border-white/10 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">
            {entry.review_title || "Review"}
          </CardTitle>
          <CardDescription>
            {entry.has_spoilers ? "Contains spoilers" : "No spoiler flag"}
          </CardDescription>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
          {entry.review_body || "No review written yet."}
        </CardContent>
      </Card>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-muted rounded-full px-3 py-1 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <Link href="/library/" className="text-muted-foreground text-sm underline">
        Back to library
      </Link>
    </div>
  );
}
