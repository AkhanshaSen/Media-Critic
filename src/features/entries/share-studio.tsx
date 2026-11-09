"use client";

import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  getShelfAverageRating,
  updateShareTemplate,
} from "@/features/entries/data";
import {
  ShareCardPreview,
  buildShareCaption,
  buildShareLink,
  shareEntryCard,
  type SharePreviewTheme,
} from "@/features/entries/share-cards";
import {
  SHARE_TEMPLATES,
  type MediaEntry,
  type ShareTemplate,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

export function ShareStudioDialog({
  entry,
  shareTemplate,
  open,
  onOpenChange,
  onShareTemplate,
  watermarkEnabled = true,
  onWatermarkChange,
}: {
  entry: MediaEntry;
  shareTemplate: ShareTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareTemplate: (t: ShareTemplate) => void;
  watermarkEnabled?: boolean;
  onWatermarkChange?: (enabled: boolean) => void;
}) {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<SharePreviewTheme>("dark");
  const [showShelfAvg, setShowShelfAvg] = useState(false);
  const [shelfAverage, setShelfAverage] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !showShelfAvg) return;
    let cancelled = false;
    void getShelfAverageRating().then((avg) => {
      if (!cancelled) setShelfAverage(avg);
    });
    return () => {
      cancelled = true;
    };
  }, [open, showShelfAvg]);

  async function pickShare(t: ShareTemplate) {
    if (t === shareTemplate || busy) return;
    setBusy(true);
    setError(null);
    onShareTemplate(t);
    const result = await updateShareTemplate(t);
    if (!result.ok) setError(result.error);
    setBusy(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(buildShareLink(entry.id));
      toast({ title: "Link copied" });
    } catch {
      setError("Could not copy link.");
      toast({ title: "Could not copy link" });
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(
        buildShareCaption(entry, {
          includeShelfAverage: showShelfAvg,
          shelfAverage,
        }),
      );
      toast({ title: "Caption copied", description: "Includes the entry link." });
    } catch {
      setError("Could not copy caption.");
      toast({ title: "Could not copy caption" });
    }
  }

  async function captureBlob(): Promise<Blob | null> {
    const node = exportRef.current;
    if (!node) return null;
    try {
      return await toBlob(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: previewTheme === "light" ? "#f7f4ef" : "#0b0b0f",
      });
    } catch {
      return null;
    }
  }

  async function shareCard() {
    setBusy(true);
    setError(null);
    const blob = await captureBlob();
    if (!blob) {
      setBusy(false);
      setError("Could not render share image.");
      toast({ title: "Could not render share image" });
      return;
    }
    const result = await shareEntryCard(entry, blob, {
      includeShelfAverage: showShelfAvg,
      shelfAverage,
    });
    setBusy(false);
    if (result.ok) {
      toast({
        title:
          result.method === "share"
            ? "Shared"
            : result.method === "download"
              ? "Image saved"
              : "Copied",
        description:
          result.method === "download"
            ? "Caption copied; PNG downloaded."
            : undefined,
      });
      return;
    }
    if (!result.aborted) {
      setError(result.error);
      toast({ title: "Could not share", description: result.error });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      <DialogContent sheet className="sm:max-w-xl">
        <DialogHeader>
          <div className="min-w-0 space-y-0.5">
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>
              Pick a brief share card, then copy a link or share image + caption.
            </DialogDescription>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border border-white/10 p-0.5">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPreviewTheme(t)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition-colors",
                    previewTheme === t
                      ? "bg-amber-400 text-amber-950"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="text-muted-foreground inline-flex min-h-11 cursor-pointer items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={showShelfAvg}
                onChange={(e) => setShowShelfAvg(e.target.checked)}
                className="accent-amber-400 size-3.5 rounded"
              />
              All-time avg
            </label>
            {onWatermarkChange ? (
              <label className="text-muted-foreground inline-flex min-h-11 cursor-pointer items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => onWatermarkChange(e.target.checked)}
                  className="accent-amber-400 size-3.5 rounded"
                />
                Watermark
              </label>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-300/90">
              Share card
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {SHARE_TEMPLATES.map((t) => (
                <ShareCardPreview
                  key={t}
                  entry={entry}
                  template={t}
                  selected={shareTemplate === t}
                  onSelect={() => void pickShare(t)}
                  theme={previewTheme}
                  showShelfAverage={showShelfAvg}
                  shelfAverage={shelfAverage}
                  watermark={watermarkEnabled}
                />
              ))}
            </div>
          </div>

          {/* Off-screen export target for the selected card */}
          <div
            aria-hidden
            className="pointer-events-none fixed top-0 left-[-9999px] z-[-1]"
          >
            <div ref={exportRef} className="w-[360px] overflow-hidden rounded-xl">
              <ShareCardPreview
                entry={entry}
                template={shareTemplate}
                theme={previewTheme}
                showShelfAverage={showShelfAvg}
                shelfAverage={shelfAverage}
                watermark={watermarkEnabled}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void copyLink()}
              className="border-border hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-medium"
            >
              Copy link
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void copyCaption()}
              className="border-border hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-medium"
            >
              Copy caption
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void shareCard()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-semibold"
            >
              {busy ? "Working…" : "Share image…"}
            </button>
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
