"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Share2 } from "lucide-react";

import { ScreenBreadcrumb } from "@/components/layout/screen-breadcrumb";
import type { MediaEntry } from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function EntryPageChrome({
  entry,
  notice,
  onShare,
  className,
}: {
  entry: MediaEntry;
  notice?: string | null;
  onShare: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <ScreenBreadcrumb
        items={[
          { label: "Shelf", href: "/dashboard/" },
          { label: "Library", href: "/library/" },
          { label: entry.title },
        ]}
      />

      <div className="border-border/80 bg-card/50 sticky top-14 z-30 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
        <Link
          href="/library/"
          className="border-border hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </Link>

        <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
          {entry.title}
        </p>

        <button
          type="button"
          onClick={onShare}
          className="border-border hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium"
        >
          <Share2 className="size-3.5" aria-hidden />
          Share
        </button>

        <Link
          href={`/entries/edit/?id=${entry.id}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Link>
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
