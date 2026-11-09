"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  getEntry,
  getEntryTags,
  getShareTemplate,
  listEntryImages,
  type EntryImage,
} from "@/features/entries/data";
import { EntryLayoutByTemplate } from "@/features/entries/entry-layouts";
import { TemplateExplorer } from "@/features/entries/template-explorer";
import type {
  MediaEntry,
  PageTemplate,
  ShareTemplate,
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
  const [pageTemplate, setPageTemplate] = useState<PageTemplate>("cinematic");
  const [shareTemplate, setShareTemplate] =
    useState<ShareTemplate>("minimal_dark");
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
      const [e, t, images, share] = await Promise.all([
        getEntry(id),
        getEntryTags(id),
        listEntryImages(id),
        getShareTemplate(),
      ]);
      if (cancelled) return;
      setEntry(e);
      setTags(t);
      setStills(images.filter((img) => img.role === "still"));
      setPageTemplate(e?.page_template ?? "cinematic");
      setShareTemplate(share);
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <TemplateExplorer
        entry={entry}
        pageTemplate={pageTemplate}
        shareTemplate={shareTemplate}
        onPageTemplate={(t) => {
          setPageTemplate(t);
          setEntry((prev) => (prev ? { ...prev, page_template: t } : prev));
        }}
        onShareTemplate={setShareTemplate}
      />

      <EntryLayoutByTemplate
        template={pageTemplate}
        entry={entry}
        tags={tags}
        stills={stills}
        onEntryChange={setEntry}
      />
    </div>
  );
}
