"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getEntry, getEntryTags } from "@/features/entries/data";
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
    <div className="space-y-6">
      <PageHeader title="Edit entry" description={entry.title} />
      <EntryForm
        mode="edit"
        entryId={entry.id}
        initial={entryToFormInitial(entry, tags)}
      />
    </div>
  );
}
