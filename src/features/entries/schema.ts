import { z } from "zod";

export const MEDIA_TYPES = [
  "anime",
  "movie",
  "series",
  "manga",
  "manhwa",
  "manhua",
  "novel",
] as const;

export const ENTRY_STATUSES = [
  "watching",
  "reading",
  "completed",
  "plan_to_watch",
  "plan_to_read",
  "on_hold",
  "dropped",
] as const;

export const PROGRESS_UNITS = ["episode", "chapter", "page", "minute"] as const;
export const CONSUMPTION_FORMATS = ["digital", "physical", "mixed"] as const;

export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const entryStatusSchema = z.enum(ENTRY_STATUSES);
export const progressUnitSchema = z.enum(PROGRESS_UNITS);
export const consumptionFormatSchema = z.enum(CONSUMPTION_FORMATS);

const nullableInt = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  })
  .pipe(z.number().int().min(0).nullable());

const nullableDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const s = String(v).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  });

export const entryFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  original_title: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  media_type: mediaTypeSchema,
  year: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    })
    .pipe(z.number().int().min(1800).max(2100).nullable()),
  status: entryStatusSchema,
  progress_current: z.coerce.number().int().min(0).default(0),
  progress_total: nullableInt,
  progress_unit: progressUnitSchema.nullable().optional(),
  consumption_format: consumptionFormatSchema.default("digital"),
  volume_current: nullableInt,
  volume_total: nullableInt,
  started_on: nullableDate,
  finished_on: nullableDate,
  rating: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    })
    .pipe(
      z
        .number()
        .min(1)
        .max(10)
        .refine((n) => Math.abs(n * 2 - Math.round(n * 2)) < 1e-9, {
          message: "Rating must use half-point steps",
        })
        .nullable(),
    ),
  review_title: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  review_body: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  verdict: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  has_spoilers: z.coerce.boolean().default(false),
  tags_text: z.string().trim().max(500).optional().default(""),
});

export type EntryFormValues = z.infer<typeof entryFormSchema>;

export type ProgressUnit = (typeof PROGRESS_UNITS)[number];
export type ConsumptionFormat = (typeof CONSUMPTION_FORMATS)[number];

export type MediaEntry = {
  id: string;
  title: string;
  original_title: string | null;
  media_type: (typeof MEDIA_TYPES)[number];
  year: number | null;
  status: (typeof ENTRY_STATUSES)[number];
  progress_current: number;
  progress_total: number | null;
  progress_unit: ProgressUnit | null;
  consumption_format: ConsumptionFormat;
  volume_current: number | null;
  volume_total: number | null;
  started_on: string | null;
  finished_on: string | null;
  rating: number | null;
  review_title: string | null;
  review_body: string | null;
  verdict: string | null;
  has_spoilers: boolean;
  cover_image_id: string | null;
  /** Storage path in entry-images bucket (when cover exists). */
  cover_path: string | null;
  /** Short-lived signed URL for display (client-filled). */
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export const MEDIA_TYPE_LABELS: Record<(typeof MEDIA_TYPES)[number], string> = {
  anime: "Anime",
  movie: "Movie",
  series: "TV Series",
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  novel: "Light Novel",
};

export const STATUS_LABELS: Record<(typeof ENTRY_STATUSES)[number], string> = {
  watching: "Watching",
  reading: "Reading",
  completed: "Completed",
  plan_to_watch: "Plan to Watch",
  plan_to_read: "Plan to Read",
  on_hold: "On Hold",
  dropped: "Dropped",
};

export const CONSUMPTION_FORMAT_LABELS: Record<ConsumptionFormat, string> = {
  digital: "Digital",
  physical: "Physical",
  mixed: "Mixed",
};

export const MEDIA_TYPE_GRADIENT: Record<(typeof MEDIA_TYPES)[number], string> =
  {
    anime: "from-violet-600/50 via-indigo-900/40 to-background",
    movie: "from-rose-600/40 via-slate-900/50 to-background",
    series: "from-sky-600/40 via-slate-900/50 to-background",
    manga: "from-amber-500/40 via-orange-950/40 to-background",
    manhwa: "from-fuchsia-500/40 via-purple-950/40 to-background",
    manhua: "from-teal-500/40 via-emerald-950/40 to-background",
    novel: "from-lime-500/30 via-stone-900/50 to-background",
  };

export function isReadingType(
  mediaType: (typeof MEDIA_TYPES)[number],
): boolean {
  return (
    mediaType === "manga" ||
    mediaType === "manhwa" ||
    mediaType === "manhua" ||
    mediaType === "novel"
  );
}

export function defaultProgressUnit(
  mediaType: (typeof MEDIA_TYPES)[number],
): ProgressUnit {
  if (mediaType === "movie") return "minute";
  if (isReadingType(mediaType)) return "chapter";
  return "episode";
}

export function resolveProgressUnit(
  entry: Pick<MediaEntry, "progress_unit" | "media_type">,
): ProgressUnit {
  return entry.progress_unit ?? defaultProgressUnit(entry.media_type);
}

export function progressLabels(unit: ProgressUnit): {
  current: string;
  total: string;
  short: string;
  perWeek: string;
} {
  switch (unit) {
    case "chapter":
      return {
        current: "Chapter",
        total: "Chapters",
        short: "Ch.",
        perWeek: "ch/week",
      };
    case "page":
      return {
        current: "Page",
        total: "Pages",
        short: "p.",
        perWeek: "pages/week",
      };
    case "minute":
      return {
        current: "Minutes",
        total: "Minutes",
        short: "min",
        perWeek: "min/week",
      };
    default:
      return {
        current: "Episode",
        total: "Episodes",
        short: "Ep.",
        perWeek: "ep/week",
      };
  }
}

export function formatProgress(
  entry: Pick<
    MediaEntry,
    | "progress_current"
    | "progress_total"
    | "progress_unit"
    | "media_type"
    | "volume_current"
    | "volume_total"
    | "consumption_format"
  >,
): string {
  const unit = resolveProgressUnit(entry);
  const labels = progressLabels(unit);
  const main =
    entry.progress_total != null
      ? `${labels.short} ${entry.progress_current} / ${entry.progress_total}`
      : `${labels.short} ${entry.progress_current}`;

  const showVol =
    entry.consumption_format === "physical" ||
    entry.consumption_format === "mixed";
  if (showVol && (entry.volume_current != null || entry.volume_total != null)) {
    const vol =
      entry.volume_total != null
        ? `Vol. ${entry.volume_current ?? 0} / ${entry.volume_total}`
        : `Vol. ${entry.volume_current ?? 0}`;
    return `${main} · ${vol}`;
  }
  return main;
}

export function progressPercent(
  entry: Pick<MediaEntry, "progress_current" | "progress_total">,
): number | null {
  if (entry.progress_total == null || entry.progress_total <= 0) return null;
  return Math.min(
    100,
    Math.round((entry.progress_current / entry.progress_total) * 100),
  );
}

export type PaceStats = {
  daysElapsed: number | null;
  ratePerWeek: number | null;
  daysLeft: number | null;
  unitLabel: string;
};

export function paceStats(
  entry: Pick<
    MediaEntry,
    | "started_on"
    | "finished_on"
    | "progress_current"
    | "progress_total"
    | "progress_unit"
    | "media_type"
  >,
): PaceStats {
  const unit = resolveProgressUnit(entry);
  const labels = progressLabels(unit);
  const empty: PaceStats = {
    daysElapsed: null,
    ratePerWeek: null,
    daysLeft: null,
    unitLabel: labels.perWeek,
  };

  if (!entry.started_on) return empty;

  const start = new Date(`${entry.started_on}T00:00:00`);
  const end = entry.finished_on
    ? new Date(`${entry.finished_on}T00:00:00`)
    : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return empty;

  const daysElapsed = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const ratePerWeek =
    entry.progress_current > 0
      ? Math.round((entry.progress_current / daysElapsed) * 7 * 10) / 10
      : null;

  let daysLeft: number | null = null;
  if (
    ratePerWeek &&
    ratePerWeek > 0 &&
    entry.progress_total != null &&
    entry.progress_current < entry.progress_total
  ) {
    const remaining = entry.progress_total - entry.progress_current;
    daysLeft = Math.ceil((remaining / ratePerWeek) * 7);
  }

  return { daysElapsed, ratePerWeek, daysLeft, unitLabel: labels.perWeek };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function activeStatusFor(
  mediaType: (typeof MEDIA_TYPES)[number],
): "watching" | "reading" {
  return isReadingType(mediaType) ? "reading" : "watching";
}

export function parseTagsText(tagsText: string): string[] {
  return Array.from(
    new Set(
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => t.slice(0, 48)),
    ),
  ).slice(0, 20);
}

export const ENTRY_SELECT =
  "id, title, original_title, media_type, year, status, progress_current, progress_total, progress_unit, consumption_format, volume_current, volume_total, started_on, finished_on, rating, review_title, review_body, verdict, has_spoilers, cover_image_id, created_at, updated_at";
