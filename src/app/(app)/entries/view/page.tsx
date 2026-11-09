"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import {
  getAlwaysShowSpoilers,
  getEntry,
  getEntryTags,
  getSharePrefs,
  getShareTemplate,
  listEntryImages,
  updateAlwaysShowSpoilers,
  updateWatermarkEnabled,
  type EntryImage,
} from "@/features/entries/data";
import { EntryLayoutByTemplate } from "@/features/entries/entry-layouts";
import { EntryPageChrome } from "@/features/entries/entry-page-chrome";
import { PageLayoutPicker } from "@/features/entries/page-layout-picker";
import { ShareStudioDialog } from "@/features/entries/share-studio";
import type {
  MediaEntry,
  PageTemplate,
  ShareTemplate,
} from "@/features/entries/schema";
import { extractCoverAccent } from "@/lib/cover-accent";

export default function EntryViewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <EntryViewContent />
    </Suspense>
  );
}

function EntryViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const justAdded = searchParams.get("added") === "1";
  const [entry, setEntry] = useState<MediaEntry | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [stills, setStills] = useState<EntryImage[]>([]);
  const [pageTemplate, setPageTemplate] = useState<PageTemplate>("cinematic");
  const [shareTemplate, setShareTemplate] =
    useState<ShareTemplate>("minimal_dark");
  const [studioOpen, setStudioOpen] = useState(false);
  const [watermark, setWatermark] = useState(true);
  const [alwaysShowSpoilers, setAlwaysShowSpoilers] = useState(false);
  const [accent, setAccent] = useState<{ accent: string; glow: string } | null>(
    null,
  );
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
      const [e, t, images, share, prefs, spoilers] = await Promise.all([
        getEntry(id),
        getEntryTags(id),
        listEntryImages(id),
        getShareTemplate(),
        getSharePrefs(),
        getAlwaysShowSpoilers(),
      ]);
      if (cancelled) return;
      setEntry(e);
      setTags(t);
      setStills(images.filter((img) => img.role === "still"));
      setPageTemplate(e?.page_template ?? "cinematic");
      setShareTemplate(share);
      setWatermark(prefs.watermark_enabled);
      setAlwaysShowSpoilers(spoilers);
      setLoading(false);

      if (e?.cover_url) {
        const next = await extractCoverAccent(e.cover_url);
        if (!cancelled) setAccent(next);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const accentStyle = useMemo(() => {
    if (!accent) return undefined;
    return {
      ["--entry-accent" as string]: accent.accent,
      ["--entry-glow" as string]: accent.glow,
    };
  }, [accent]);

  function handleShare() {
    setStudioOpen(true);
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
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
      <EntryPageChrome
        entry={entry}
        notice={
          justAdded ? "Added to your shelf — write your review anytime." : null
        }
        onShare={() => void handleShare()}
      />

      {entry.has_spoilers ? (
        <label className="text-muted-foreground inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="accent-amber-400 size-3.5"
            checked={alwaysShowSpoilers}
            onChange={(e) => {
              const next = e.target.checked;
              setAlwaysShowSpoilers(next);
              void updateAlwaysShowSpoilers(next);
            }}
          />
          Always show spoilers
        </label>
      ) : null}

      <ShareStudioDialog
        entry={entry}
        shareTemplate={shareTemplate}
        open={studioOpen}
        onOpenChange={setStudioOpen}
        onShareTemplate={setShareTemplate}
        watermarkEnabled={watermark}
        onWatermarkChange={(enabled) => {
          setWatermark(enabled);
          void updateWatermarkEnabled(enabled);
        }}
      />

      <PageLayoutPicker
        entryId={entry.id}
        value={pageTemplate}
        onChange={(t) => {
          setPageTemplate(t);
          setEntry((prev) => (prev ? { ...prev, page_template: t } : prev));
        }}
      />

      <EntryLayoutByTemplate
        template={pageTemplate}
        entry={entry}
        tags={tags}
        stills={stills}
        onEntryChange={setEntry}
        alwaysShowSpoilers={alwaysShowSpoilers}
        accentStyle={accentStyle}
      />
    </div>
  );
}
