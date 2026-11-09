import { createClient } from "@/lib/supabase/client";

const BUCKET = "entry-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type CoverResult =
  | { ok: true; path: string; url: string | null }
  | { ok: false; error: string };

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function validateCoverFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_BYTES) {
    return "Cover must be 5 MB or smaller.";
  }
  return null;
}

export async function signCoverUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Batch-sign paths; returns map path → url. */
export async function signCoverUrls(
  paths: string[],
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (path) => {
      const url = await signCoverUrl(path);
      if (url) out[path] = url;
    }),
  );
  return out;
}

export async function setEntryCover(
  entryId: string,
  file: File,
): Promise<CoverResult> {
  const validation = validateCoverFile(file);
  if (validation) return { ok: false, error: validation };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const ext = extForMime(file.type);
  const objectId = crypto.randomUUID();
  const storagePath = `${user.id}/${entryId}/${objectId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      error:
        "Could not upload cover. Confirm the entry-images bucket and storage policies exist.",
    };
  }

  // Clear previous cover pointer (keep old file for simplicity in v1)
  const { data: existing } = await supabase
    .from("images")
    .select("id, storage_path")
    .eq("entry_id", entryId)
    .eq("is_cover", true);

  if (existing?.length) {
    await supabase
      .from("images")
      .update({ is_cover: false })
      .eq("entry_id", entryId)
      .eq("is_cover", true);
  }

  const { data: imageRow, error: insertError } = await supabase
    .from("images")
    .insert({
      user_id: user.id,
      entry_id: entryId,
      storage_path: storagePath,
      sort_order: 0,
      is_cover: true,
    })
    .select("id")
    .single();

  if (insertError || !imageRow) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: "Could not save cover metadata." };
  }

  const { error: linkError } = await supabase
    .from("media_entries")
    .update({ cover_image_id: imageRow.id })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (linkError) {
    return { ok: false, error: "Cover uploaded but failed to link to entry." };
  }

  const url = await signCoverUrl(storagePath);
  return { ok: true, path: storagePath, url };
}

export async function removeEntryCover(
  entryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { data: covers } = await supabase
    .from("images")
    .select("id, storage_path")
    .eq("entry_id", entryId)
    .eq("is_cover", true);

  await supabase
    .from("media_entries")
    .update({ cover_image_id: null })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (covers?.length) {
    const paths = covers
      .map((c: { storage_path: string }) => c.storage_path)
      .filter(Boolean);
    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
    await supabase
      .from("images")
      .delete()
      .eq("entry_id", entryId)
      .eq("is_cover", true);
  }

  return { ok: true };
}

export async function fetchCoverPathForEntry(
  entryId: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("media_entries")
    .select("cover_image_id, images:cover_image_id(storage_path)")
    .eq("id", entryId)
    .maybeSingle();

  if (!data) return null;
  const img = data.images as
    | { storage_path: string }
    | { storage_path: string }[]
    | null;
  if (!img) return null;
  if (Array.isArray(img)) return img[0]?.storage_path ?? null;
  return img.storage_path ?? null;
}

export async function fetchCoverPathsForEntries(
  entryIds: string[],
): Promise<Record<string, string>> {
  if (entryIds.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase
    .from("media_entries")
    .select("id, images:cover_image_id(storage_path)")
    .in("id", entryIds);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const img = row.images as
      | { storage_path: string }
      | { storage_path: string }[]
      | null;
    const path = Array.isArray(img)
      ? img[0]?.storage_path
      : img?.storage_path;
    if (path) map[row.id as string] = path;
  }
  return map;
}
