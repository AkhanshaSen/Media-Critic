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

export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const entryStatusSchema = z.enum(ENTRY_STATUSES);

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
  progress_total: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    })
    .pipe(z.number().int().min(0).nullable()),
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

export type MediaEntry = {
  id: string;
  title: string;
  original_title: string | null;
  media_type: (typeof MEDIA_TYPES)[number];
  year: number | null;
  status: (typeof ENTRY_STATUSES)[number];
  progress_current: number;
  progress_total: number | null;
  rating: number | null;
  review_title: string | null;
  review_body: string | null;
  verdict: string | null;
  has_spoilers: boolean;
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
