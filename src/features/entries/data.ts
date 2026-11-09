import {
  fetchCoverPathsForEntries,
  signCoverUrl,
  signCoverUrls,
} from "@/features/entries/cover-image";
import {
  ENTRY_SELECT,
  activeStatusFor,
  defaultProgressUnit,
  entryFormSchema,
  parseTagsText,
  todayIsoDate,
  type EntryFormValues,
  type MediaEntry,
} from "@/features/entries/schema";
import { createClient } from "@/lib/supabase/client";

export type DataResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/** Escape LIKE wildcards so user input is literal. */
export function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function requireUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function normalizeEntry(
  row: MediaEntry & { cover_image_id?: string | null },
): MediaEntry {
  return {
    ...row,
    progress_unit: row.progress_unit ?? null,
    consumption_format: row.consumption_format ?? "digital",
    volume_current: row.volume_current ?? null,
    volume_total: row.volume_total ?? null,
    started_on: row.started_on ?? null,
    finished_on: row.finished_on ?? null,
    synopsis: row.synopsis ?? null,
    cover_image_id: row.cover_image_id ?? null,
    cover_path: row.cover_path ?? null,
    cover_url: row.cover_url ?? null,
  };
}

async function attachCovers(entries: MediaEntry[]): Promise<MediaEntry[]> {
  if (entries.length === 0) return entries;
  const pathById = await fetchCoverPathsForEntries(entries.map((e) => e.id));
  const urls = await signCoverUrls(Object.values(pathById));
  return entries.map((e) => {
    const path = pathById[e.id] ?? null;
    return {
      ...e,
      cover_path: path,
      cover_url: path ? (urls[path] ?? null) : null,
    };
  });
}

function toRow(values: EntryFormValues, userId: string) {
  const unit = values.progress_unit ?? defaultProgressUnit(values.media_type);
  return {
    title: values.title,
    original_title: values.original_title,
    media_type: values.media_type,
    year: values.year,
    status: values.status,
    progress_current: values.progress_current,
    progress_total: values.progress_total,
    progress_unit: unit,
    consumption_format: values.consumption_format,
    volume_current: values.volume_current,
    volume_total: values.volume_total,
    started_on: values.started_on,
    finished_on: values.finished_on,
    rating: values.rating,
    review_title: values.review_title,
    review_body: values.review_body,
    verdict: values.verdict,
    has_spoilers: values.has_spoilers,
    external_source: "manual" as const,
    user_id: userId,
  };
}

async function syncTags(entryId: string, userId: string, tagsText: string) {
  const supabase = createClient();
  const names = parseTagsText(tagsText);

  await supabase.from("entry_tags").delete().eq("entry_id", entryId);

  if (names.length === 0) return;

  const tagIds: string[] = [];

  for (const name of names) {
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      tagIds.push(existing.id);
      continue;
    }

    const { data: created } = await supabase
      .from("tags")
      .insert({ name, user_id: userId })
      .select("id")
      .single();

    if (created?.id) tagIds.push(created.id);
  }

  if (tagIds.length > 0) {
    await supabase.from("entry_tags").insert(
      tagIds.map((tag_id) => ({ entry_id: entryId, tag_id })),
    );
  }
}

export async function createEntry(
  raw: unknown,
): Promise<DataResult<{ id: string }>> {
  const parsed = entryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check the form fields and try again." };
  }

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("media_entries")
    .insert(toRow(parsed.data, userId))
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        "Could not save. Confirm auth RLS migration ran and you are signed in.",
    };
  }

  await syncTags(data.id, userId, parsed.data.tags_text);
  return { ok: true, data: { id: data.id } };
}

export async function updateEntry(
  id: string,
  raw: unknown,
): Promise<DataResult<{ id: string }>> {
  if (!isUuid(id)) return { ok: false, error: "Invalid entry." };

  const parsed = entryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check the form fields and try again." };
  }

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("media_entries")
    .update(toRow(parsed.data, userId))
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: "Could not update the entry. Try again." };
  }

  await syncTags(id, userId, parsed.data.tags_text);
  return { ok: true, data: { id } };
}

export async function deleteEntry(id: string): Promise<DataResult> {
  if (!isUuid(id)) return { ok: false, error: "Invalid entry." };

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("media_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: "Could not delete the entry. Try again." };
  }

  return { ok: true };
}

export async function getEntry(id: string): Promise<MediaEntry | null> {
  if (!isUuid(id)) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("media_entries")
    .select(ENTRY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const [withCover] = await attachCovers([
    normalizeEntry(data as MediaEntry),
  ]);
  return withCover;
}

export async function getEntryTags(entryId: string): Promise<string[]> {
  if (!isUuid(entryId)) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("entry_tags")
    .select("tags(name)")
    .eq("entry_id", entryId);

  if (!data) return [];
  return data
    .map((row: { tags: { name: string } | { name: string }[] | null }) => {
      const tags = row.tags;
      if (!tags) return null;
      if (Array.isArray(tags)) return tags[0]?.name ?? null;
      return tags.name;
    })
    .filter((n: string | null): n is string => Boolean(n));
}

export type ListFilters = {
  q?: string;
  media_type?: string;
  status?: string;
  sort?: "updated" | "rating" | "title" | "year";
};

export async function listEntries(
  filters: ListFilters = {},
): Promise<MediaEntry[]> {
  const supabase = createClient();
  let query = supabase.from("media_entries").select(ENTRY_SELECT);

  if (filters.media_type) {
    query = query.eq("media_type", filters.media_type);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.q?.trim()) {
    query = query.ilike("title", `%${escapeIlike(filters.q.trim())}%`);
  }

  switch (filters.sort) {
    case "rating":
      query = query.order("rating", { ascending: false, nullsFirst: false });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "year":
      query = query.order("year", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query.limit(200);
  if (error || !data) return [];
  return attachCovers((data as MediaEntry[]).map(normalizeEntry));
}

export async function countEntries(): Promise<number | null> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("media_entries")
    .select("*", { count: "exact", head: true });
  if (error) return null;
  return count;
}

/** Increment or decrement progress with auto start/complete side effects. */
export async function bumpProgress(
  entryId: string,
  delta = 1,
): Promise<DataResult<{ entry: MediaEntry; justCompleted: boolean }>> {
  if (!isUuid(entryId)) return { ok: false, error: "Invalid entry." };

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const current = await getEntry(entryId);
  if (!current) return { ok: false, error: "Entry not found." };

  let next = Math.max(0, current.progress_current + delta);
  if (current.progress_total != null) {
    next = Math.min(next, current.progress_total);
  }

  const patch: Record<string, unknown> = {
    progress_current: next,
  };

  if (!current.started_on && next > 0) {
    patch.started_on = todayIsoDate();
  }

  if (
    current.status === "plan_to_watch" ||
    current.status === "plan_to_read" ||
    current.status === "on_hold"
  ) {
    if (next > 0) {
      patch.status = activeStatusFor(current.media_type);
    }
  }

  let justCompleted = false;
  if (
    current.progress_total != null &&
    next >= current.progress_total &&
    current.progress_total > 0
  ) {
    patch.status = "completed";
    patch.finished_on = current.finished_on ?? todayIsoDate();
    justCompleted = current.status !== "completed";
  } else if (current.status === "completed" && delta < 0) {
    patch.status = activeStatusFor(current.media_type);
    patch.finished_on = null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("media_entries")
    .update(patch)
    .eq("id", entryId)
    .eq("user_id", userId)
    .select(ENTRY_SELECT)
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not update progress." };
  }

  const entry = normalizeEntry(data as MediaEntry);
  if (current.cover_path) {
    entry.cover_path = current.cover_path;
    entry.cover_url =
      current.cover_url ?? (await signCoverUrl(current.cover_path));
  }
  return {
    ok: true,
    data: { entry, justCompleted },
  };
}

export {
  removeEntryCover,
  setEntryCover,
  validateCoverFile,
} from "@/features/entries/cover-image";

