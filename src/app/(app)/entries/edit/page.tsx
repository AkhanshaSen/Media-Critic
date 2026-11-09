"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import {
  getEntry,
  getEntryTags,
  listEntryImages,
} from "@/features/entries/data";
import {
  EntryForm,
  entryToFormInitial,
} from "@/features/entries/entry-form";
import type { MediaEntry } from "@/features/entries/schema";

export default function EditEntryPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
    >
      <EditContent />
    </Suspense>
  );
}

function EditContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [entry, setEntry] = useState<MediaEntry | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [stillsCount, setStillsCount] = useState(0);
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
      const [e, t, images] = await Promise.all([
        getEntry(id),
        getEntryTags(id),
        listEntryImages(id),
      ]);
      if (cancelled) return;
      setEntry(e);
      setTags(t);
      setStillsCount(images.filter((img) => img.role === "still").length);
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
    <div className="space-y-6">
      <PageHeader
        title="Edit entry"
        description={entry.title}
        breadcrumb={[
          { label: "Shelf", href: "/dashboard/" },
          { label: "Library", href: "/library/" },
          { label: entry.title, href: `/entries/view/?id=${entry.id}` },
          { label: "Edit" },
        ]}
        action={
          <Link
            href={`/entries/view/?id=${entry.id}`}
            className="border-border hover:bg-muted inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium"
          >
            View entry
          </Link>
        }
      />
      <EntryForm
        mode="edit"
        entryId={entry.id}
        initial={{
          ...entryToFormInitial(entry, tags),
          stills_count: stillsCount,
        }}
      />
    </div>
  );
}
