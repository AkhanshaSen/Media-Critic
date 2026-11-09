"use client";

import { RatingStars } from "@/features/entries/rating-stars";
import {
  SHARE_TEMPLATE_LABELS,
  type MediaEntry,
  type ShareTemplate,
} from "@/features/entries/schema";
import { getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export type SharePreviewTheme = "dark" | "light";

function WatermarkLine({
  theme,
  enabled,
}: {
  theme: SharePreviewTheme;
  enabled: boolean;
}) {
  if (!enabled) return null;
  return (
    <p
      className={cn(
        "pt-1 text-[9px] tracking-widest uppercase",
        theme === "light" ? "text-stone-400" : "text-white/35",
      )}
    >
      Media Critic
    </p>
  );
}

export function ShareCardPreview({
  entry,
  template,
  selected,
  onSelect,
  theme = "dark",
  showShelfAverage = false,
  shelfAverage = null,
  watermark = true,
}: {
  entry: MediaEntry;
  template: ShareTemplate;
  selected?: boolean;
  onSelect?: () => void;
  theme?: SharePreviewTheme;
  showShelfAverage?: boolean;
  shelfAverage?: number | null;
  watermark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full overflow-hidden rounded-xl border text-left transition-all",
        selected
          ? "border-amber-400 ring-2 ring-amber-400/40"
          : "border-white/10 hover:border-amber-400/40",
      )}
    >
      <div
        className={cn(
          "border-b px-2 py-1 text-[10px] font-medium tracking-wide uppercase",
          theme === "light"
            ? "border-black/10 bg-stone-100 text-amber-800"
            : "border-white/10 bg-black/40 text-amber-200/90",
        )}
      >
        {SHARE_TEMPLATE_LABELS[template]}
      </div>
      {template === "minimal_dark" ? (
        <MinimalDarkCard
          entry={entry}
          theme={theme}
          showShelfAverage={showShelfAverage}
          shelfAverage={shelfAverage}
          watermark={watermark}
        />
      ) : template === "poster_score" ? (
        <PosterScoreCard
          entry={entry}
          theme={theme}
          showShelfAverage={showShelfAverage}
          shelfAverage={shelfAverage}
          watermark={watermark}
        />
      ) : (
        <VerdictQuoteCard
          entry={entry}
          theme={theme}
          showShelfAverage={showShelfAverage}
          shelfAverage={shelfAverage}
          watermark={watermark}
        />
      )}
    </button>
  );
}

function ShelfAvgLine({
  theme,
  shelfAverage,
}: {
  theme: SharePreviewTheme;
  shelfAverage: number | null;
}) {
  if (shelfAverage == null) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 pt-1",
        theme === "light" ? "text-stone-500" : "text-white/50",
      )}
    >
      <span className="text-[10px] tracking-wide uppercase">Shelf</span>
      <RatingStars
        value={shelfAverage}
        size="sm"
        variant={theme}
        showValue
      />
    </div>
  );
}

function MinimalDarkCard({
  entry,
  theme,
  showShelfAverage,
  shelfAverage,
  watermark,
}: {
  entry: MediaEntry;
  theme: SharePreviewTheme;
  showShelfAverage: boolean;
  shelfAverage: number | null;
  watermark: boolean;
}) {
  const light = theme === "light";
  return (
    <div
      className={cn(
        "space-y-2 p-3",
        light ? "bg-[#f7f4ef]" : "bg-[#0b0b0f]",
      )}
    >
      <WatermarkLine theme={theme} enabled={watermark} />
      <p
        className={cn(
          "line-clamp-2 text-sm font-semibold",
          light ? "text-stone-900" : "text-white",
        )}
      >
        {entry.title}
      </p>
      <RatingStars
        value={entry.rating}
        size="lg"
        variant={theme}
        showValue
      />
      {showShelfAverage ? (
        <ShelfAvgLine theme={theme} shelfAverage={shelfAverage} />
      ) : null}
    </div>
  );
}

function PosterScoreCard({
  entry,
  theme,
  showShelfAverage,
  shelfAverage,
  watermark,
}: {
  entry: MediaEntry;
  theme: SharePreviewTheme;
  showShelfAverage: boolean;
  shelfAverage: number | null;
  watermark: boolean;
}) {
  const light = theme === "light";
  return (
    <div
      className={cn(
        "relative flex min-h-28 items-end overflow-hidden",
        light ? "bg-stone-200" : "bg-[#111]",
      )}
    >
      {entry.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.cover_url}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0",
            light
              ? "bg-gradient-to-br from-amber-100 to-stone-200"
              : "bg-gradient-to-br from-amber-900/40 to-black",
          )}
        />
      )}
      <div
        className={cn(
          "relative z-10 flex w-full flex-col gap-1.5 p-3",
          light
            ? "bg-gradient-to-t from-white/95 via-white/55 to-transparent"
            : "bg-gradient-to-t from-black/90 via-black/45 to-transparent",
        )}
      >
        <div className="flex items-end justify-between gap-2">
          <p
            className={cn(
              "line-clamp-2 text-xs font-semibold",
              light ? "text-stone-900" : "text-white",
            )}
          >
            {entry.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-1 shadow-sm",
              light ? "bg-amber-400/90" : "bg-amber-400",
            )}
          >
            <RatingStars
              value={entry.rating}
              size="sm"
              variant="light"
              showValue
            />
          </span>
        </div>
        {showShelfAverage ? (
          <ShelfAvgLine theme={theme} shelfAverage={shelfAverage} />
        ) : null}
        <WatermarkLine theme={theme} enabled={watermark} />
      </div>
    </div>
  );
}

function VerdictQuoteCard({
  entry,
  theme,
  showShelfAverage,
  shelfAverage,
  watermark,
}: {
  entry: MediaEntry;
  theme: SharePreviewTheme;
  showShelfAverage: boolean;
  shelfAverage: number | null;
  watermark: boolean;
}) {
  const light = theme === "light";
  return (
    <div
      className={cn(
        "space-y-2 p-3",
        light ? "bg-[#faf8f5]" : "bg-[#121018]",
      )}
    >
      <p
        className={cn(
          "line-clamp-1 text-[11px] font-medium",
          light ? "text-stone-600" : "text-white/70",
        )}
      >
        {entry.title}
      </p>
      <p
        className={cn(
          "line-clamp-3 text-sm italic",
          light ? "text-stone-800" : "text-amber-100/90",
        )}
      >
        “{entry.verdict || entry.review_body || "No verdict yet."}”
      </p>
      <RatingStars value={entry.rating} size="sm" variant={theme} showValue />
      {showShelfAverage ? (
        <ShelfAvgLine theme={theme} shelfAverage={shelfAverage} />
      ) : null}
      <WatermarkLine theme={theme} enabled={watermark} />
    </div>
  );
}

export function buildShareLink(entryId: string): string {
  // getSiteUrl() already includes basePath — do not use appPath() here or the
  // base path is prepended twice (e.g. /Media-Critic/Media-Critic/…)
  return `${getSiteUrl()}/entries/view/?id=${encodeURIComponent(entryId)}`;
}

export function buildShareCaption(
  entry: MediaEntry,
  options?: { includeShelfAverage?: boolean; shelfAverage?: number | null },
): string {
  const url = buildShareLink(entry.id);
  const parts = [
    entry.title,
    entry.rating != null ? `Score: ${entry.rating}/10` : null,
    options?.includeShelfAverage && options.shelfAverage != null
      ? `Shelf avg: ${options.shelfAverage}/10`
      : null,
    entry.verdict ? entry.verdict.slice(0, 120) : null,
    url,
  ].filter(Boolean);
  return parts.join("\n");
}

export function buildShareText(
  entry: MediaEntry,
  options?: { includeShelfAverage?: boolean; shelfAverage?: number | null },
): string {
  const parts = [
    entry.title,
    entry.rating != null ? `Score: ${entry.rating}/10` : null,
    options?.includeShelfAverage && options.shelfAverage != null
      ? `Shelf average: ${options.shelfAverage}/10`
      : null,
    entry.verdict ? `Verdict: ${entry.verdict}` : null,
    entry.review_body ? entry.review_body.slice(0, 400) : null,
    buildShareLink(entry.id),
    "— via Media Critic",
  ].filter(Boolean);
  return parts.join("\n");
}

export type ShareEntryResult =
  | { ok: true; method: "share" | "clipboard" | "download" }
  | { ok: false; error: string; aborted?: boolean };

/** Native share sheet when available; otherwise copy review text to clipboard. */
export async function shareEntryReview(
  entry: MediaEntry,
  options?: { includeShelfAverage?: boolean; shelfAverage?: number | null },
): Promise<ShareEntryResult> {
  const text = buildShareText(entry, options);
  const url = buildShareLink(entry.id);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: entry.title, text, url });
      return { ok: true, method: "share" };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { ok: false, error: "Share cancelled.", aborted: true };
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, method: "clipboard" };
  } catch {
    return { ok: false, error: "Could not copy. Try again." };
  }
}

/**
 * System share sheet with caption (includes URL) + PNG when possible.
 * Omits the separate `url` field when sharing files — macOS/Safari often
 * mishandles url+files together; the link stays in the caption text.
 */
export async function shareEntryBundle(
  entry: MediaEntry,
  blob: Blob,
  options?: { includeShelfAverage?: boolean; shelfAverage?: number | null },
): Promise<ShareEntryResult> {
  const caption = buildShareCaption(entry, options);
  const url = buildShareLink(entry.id);
  const file = new File([blob], `${slugify(entry.title)}-media-critic.png`, {
    type: "image/png",
  });

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";
  const canShareData =
    canShare && typeof navigator.canShare === "function"
      ? (data: ShareData) => {
          try {
            return navigator.canShare(data);
          } catch {
            return false;
          }
        }
      : null;

  if (canShare) {
    const withFiles: ShareData = {
      title: entry.title,
      text: caption,
      files: [file],
    };
    const filesOnly: ShareData = {
      title: entry.title,
      text: entry.title,
      files: [file],
    };
    const textOnly: ShareData = {
      title: entry.title,
      text: caption,
      url,
    };

    // Build a priority list — only ONE succeeds before returning.
    // textOnly is a final fallback, never alongside a file share attempt.
    const attempts: ShareData[] = [];
    if (!canShareData || canShareData(withFiles)) {
      attempts.push(withFiles);
    } else if (!canShareData || canShareData(filesOnly)) {
      attempts.push(filesOnly);
    } else if (!canShareData || canShareData(textOnly)) {
      attempts.push(textOnly);
    }

    for (const data of attempts) {
      try {
        await navigator.share(data);
        return { ok: true, method: "share" };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return { ok: false, error: "Share cancelled.", aborted: true };
        }
        // Try next payload.
      }
    }
  }

  try {
    await navigator.clipboard.writeText(caption);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(objectUrl);
    return { ok: true, method: "download" };
  } catch {
    return {
      ok: false,
      error: "Could not share. Try Copy link or Copy caption instead.",
    };
  }
}

/** @deprecated Prefer shareEntryBundle */
export async function shareEntryCard(
  entry: MediaEntry,
  blob: Blob,
  options?: { includeShelfAverage?: boolean; shelfAverage?: number | null },
): Promise<ShareEntryResult> {
  return shareEntryBundle(entry, blob, options);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "share"
  );
}
