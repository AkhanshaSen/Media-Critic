import { createClient } from "@/lib/supabase/client";

const BUCKET = "entry-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_STILLS = 12;

export type ImageRole = "poster" | "backdrop" | "still";

export type CoverResult =
  | { ok: true; path: string; url: string | null; id?: string }
  | { ok: false; error: string };

export type EntryImage = {
  id: string;
  role: ImageRole;
  storage_path: string;
  sort_order: number;
  url: string | null;
};

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
    return "Image must be 5 MB or smaller.";
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

async function deleteRoleImages(
  entryId: string,
  role: "poster" | "backdrop",
): Promise<void> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("images")
    .select("id, storage_path")
    .eq("entry_id", entryId)
    .eq("role", role);

  if (!existing?.length) return;

  const paths = existing
    .map((r: { storage_path: string }) => r.storage_path)
    .filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
  await supabase.from("images").delete().eq("entry_id", entryId).eq("role", role);
}

export async function uploadEntryImage(
  entryId: string,
  file: File,
  role: ImageRole,
  sortOrder = 0,
): Promise<CoverResult> {
  const validation = validateCoverFile(file);
  if (validation) return { ok: false, error: validation };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  if (role === "poster" || role === "backdrop") {
    await deleteRoleImages(entryId, role);
  }

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
        "Could not upload image. Confirm the entry-images bucket and storage policies exist.",
    };
  }

  const { data: imageRow, error: insertError } = await supabase
    .from("images")
    .insert({
      user_id: user.id,
      entry_id: entryId,
      storage_path: storagePath,
      sort_order: sortOrder,
      is_cover: role === "poster",
      role,
    })
    .select("id")
    .single();

  if (insertError || !imageRow) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: "Could not save image metadata." };
  }

  if (role === "poster") {
    const { error: linkError } = await supabase
      .from("media_entries")
      .update({ cover_image_id: imageRow.id })
      .eq("id", entryId)
      .eq("user_id", user.id);
    if (linkError) {
      return { ok: false, error: "Poster uploaded but failed to link to entry." };
    }
  }

  if (role === "backdrop") {
    const { error: linkError } = await supabase
      .from("media_entries")
      .update({ backdrop_image_id: imageRow.id })
      .eq("id", entryId)
      .eq("user_id", user.id);
    if (linkError) {
      return {
        ok: false,
        error: "Backdrop uploaded but failed to link to entry.",
      };
    }
  }

  const url = await signCoverUrl(storagePath);
  return { ok: true, path: storagePath, url, id: imageRow.id };
}

export async function setEntryCover(
  entryId: string,
  file: File,
): Promise<CoverResult> {
  return uploadEntryImage(entryId, file, "poster", 0);
}

export async function setEntryBackdrop(
  entryId: string,
  file: File,
): Promise<CoverResult> {
  return uploadEntryImage(entryId, file, "backdrop", 0);
}

export async function addEntryStills(
  entryId: string,
  files: File[],
): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: true, added: 0 };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { count } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true })
    .eq("entry_id", entryId)
    .eq("role", "still");

  const existing = count ?? 0;
  const room = Math.max(0, MAX_STILLS - existing);
  if (room === 0) {
    return {
      ok: false,
      error: `This title already has ${MAX_STILLS} stills.`,
    };
  }

  const toUpload = files.slice(0, room);
  let added = 0;
  for (let i = 0; i < toUpload.length; i++) {
    const result = await uploadEntryImage(
      entryId,
      toUpload[i],
      "still",
      existing + i,
    );
    if (!result.ok) {
      if (added === 0) return { ok: false, error: result.error };
      break;
    }
    added += 1;
  }

  return { ok: true, added };
}

export async function removeEntryCover(
  entryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  await supabase
    .from("media_entries")
    .update({ cover_image_id: null })
    .eq("id", entryId)
    .eq("user_id", user.id);

  await deleteRoleImages(entryId, "poster");
  return { ok: true };
}

export async function removeEntryBackdrop(
  entryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  await supabase
    .from("media_entries")
    .update({ backdrop_image_id: null })
    .eq("id", entryId)
    .eq("user_id", user.id);

  await deleteRoleImages(entryId, "backdrop");
  return { ok: true };
}

export async function removeEntryImage(
  imageId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      imageId,
    )
  ) {
    return { ok: false, error: "Invalid image." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { data: row } = await supabase
    .from("images")
    .select("id, entry_id, storage_path, role")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) return { ok: false, error: "Image not found." };

  if (row.role === "poster") {
    await supabase
      .from("media_entries")
      .update({ cover_image_id: null })
      .eq("id", row.entry_id)
      .eq("user_id", user.id);
  }
  if (row.role === "backdrop") {
    await supabase
      .from("media_entries")
      .update({ backdrop_image_id: null })
      .eq("id", row.entry_id)
      .eq("user_id", user.id);
  }

  if (row.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
  }
  await supabase.from("images").delete().eq("id", imageId).eq("user_id", user.id);
  return { ok: true };
}

export async function listEntryImages(
  entryId: string,
): Promise<EntryImage[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("images")
    .select("id, role, storage_path, sort_order")
    .eq("entry_id", entryId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!data?.length) return [];

  const urls = await signCoverUrls(
    data.map((r: { storage_path: string }) => r.storage_path),
  );

  return data.map(
    (r: {
      id: string;
      role: ImageRole;
      storage_path: string;
      sort_order: number;
    }) => ({
      id: r.id,
      role: r.role,
      storage_path: r.storage_path,
      sort_order: r.sort_order,
      url: urls[r.storage_path] ?? null,
    }),
  );
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

export async function fetchBackdropPathForEntry(
  entryId: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("media_entries")
    .select("backdrop_image_id, images:backdrop_image_id(storage_path)")
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
