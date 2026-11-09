"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  getEntry,
  getEntryTags,
  getShareTemplate,
  listEntryImages,
  type EntryImage,
} from "@/features/entries/data";
import { EntryLayoutByTemplate } from "@/features/entries/entry-layouts";
import {
  EntryPageChrome,
  type ShareStatus,
} from "@/features/entries/entry-page-chrome";
import { shareEntryReview } from "@/features/entries/share-cards";
import {
  TemplateExplorer,
  useLooksOpenState,
} from "@/features/entries/template-explorer";
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
  const justAdded = searchParams.get("added") === "1";
  const [entry, setEntry] = useState<MediaEntry | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [stills, setStills] = useState<EntryImage[]>([]);
  const [pageTemplate, setPageTemplate] = useState<PageTemplate>("cinematic");
  const [shareTemplate, setShareTemplate] =
    useState<ShareTemplate>("minimal_dark");
  const [looksOpen, setLooksOpen] = useLooksOpenState();
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [loading, setLoading] = useState(true);
  const shareStatusTimer = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (shareStatusTimer.current != null) {
        window.clearTimeout(shareStatusTimer.current);
      }
    };
  }, []);

  function flashShareStatus(next: ShareStatus) {
    setShareStatus(next);
    if (shareStatusTimer.current != null) {
      window.clearTimeout(shareStatusTimer.current);
    }
    shareStatusTimer.current = window.setTimeout(() => {
      setShareStatus("idle");
    }, 2200);
  }

  async function handleShare() {
    if (!entry) return;
    setLooksOpen(true);
    window.setTimeout(() => {
      document
        .getElementById("share-layout")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);

    const result = await shareEntryReview(entry);
    if (result.ok) {
      flashShareStatus(result.method === "share" ? "shared" : "copied");
      return;
    }
    if (result.aborted) return;
    flashShareStatus("error");
  }

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
      <EntryPageChrome
        entry={entry}
        notice={
          justAdded ? "Added to your shelf — write your review anytime." : null
        }
        shareStatus={shareStatus}
        onShare={() => void handleShare()}
      />

      <TemplateExplorer
        entry={entry}
        pageTemplate={pageTemplate}
        shareTemplate={shareTemplate}
        open={looksOpen}
        onOpenChange={setLooksOpen}
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
