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
  shareEntryBundle,
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

  async function shareBundle() {
    setBusy(true);
    setError(null);
    const blob = await captureBlob();
    if (!blob) {
      setBusy(false);
      setError("Could not render share image.");
      toast({ title: "Could not render share image" });
      return;
    }
    const result = await shareEntryBundle(entry, blob, {
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
          result.method === "share"
            ? "Link and card image."
            : result.method === "download"
              ? "Caption copied; image saved — attach it if your app needs a file."
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
              Pick a card and tap Share to send the link and image.
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
                      ? "bg-primary text-primary-foreground"
                      : "text-[var(--fg-muted)] hover:text-foreground",
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
                className="accent-primary size-3.5 rounded"
              />
              All-time avg
            </label>
            {onWatermarkChange ? (
              <label className="text-muted-foreground inline-flex min-h-11 cursor-pointer items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => onWatermarkChange(e.target.checked)}
                  className="accent-primary size-3.5 rounded"
                />
                Watermark
              </label>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold tracking-widest text-[var(--fg-muted)] uppercase">
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

          <button
            type="button"
            disabled={busy}
            onClick={() => void shareBundle()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold"
          >
            {busy ? "Working…" : "Share"}
          </button>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
