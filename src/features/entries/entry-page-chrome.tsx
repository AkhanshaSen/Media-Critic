"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Share2 } from "lucide-react";

import { ScreenBreadcrumb } from "@/components/layout/screen-breadcrumb";
import type { MediaEntry } from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export type ShareStatus = "idle" | "copied" | "shared" | "error";

export function EntryPageChrome({
  entry,
  notice,
  shareStatus = "idle",
  onShare,
  className,
}: {
  entry: MediaEntry;
  notice?: string | null;
  shareStatus?: ShareStatus;
  onShare: () => void;
  className?: string;
}) {
  const shareLabel =
    shareStatus === "copied"
      ? "Copied"
      : shareStatus === "shared"
        ? "Shared"
        : shareStatus === "error"
          ? "Retry share"
          : "Share";

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
          className={cn(
            "border-border hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium",
            shareStatus === "copied" || shareStatus === "shared"
              ? "border-amber-400/50 bg-amber-400/10 text-amber-700 dark:text-amber-200"
              : null,
          )}
        >
          <Share2 className="size-3.5" aria-hidden />
          {shareLabel}
        </button>

        <Link
          href={`/entries/edit/?id=${entry.id}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Link>
      </div>

      {shareStatus === "error" ? (
        <p role="status" className="text-destructive text-xs">
          Could not share. Open Share & layout to copy manually.
        </p>
      ) : null}

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
