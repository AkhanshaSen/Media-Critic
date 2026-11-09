#!/usr/bin/env node
/**
 * One-off sample shelf seed for Media Critic.
 * Uploads CC0/Wikimedia covers into entry-images and inserts entries for an existing user.
 *
 * Usage: npm run seed:sample
 *
 * Secrets: reads Supabase CLI token from macOS Keychain at runtime and fetches
 * service_role via Management API. Never writes service_role to disk or git.
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function projectRefFromEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL in .env.local (https://xxxxxxxx.supabase.co).",
    );
  }
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  if (!m) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must look like https://xxxxxxxx.supabase.co",
    );
  }
  return m[1];
}

const BUCKET = "entry-images";
const SAMPLE_TAG = "sample-seed";
const AVATAR_URL =
  "https://api.dicebear.com/9.x/adventurer/png?seed=MediaCritic&size=128";

/** Public-domain / Wikimedia Commons stills used as decorative sample posters. */
const SAMPLES = [
  {
    title: "Sample: Voyage to the Stars",
    media_type: "anime",
    status: "watching",
    progress_current: 4,
    progress_total: 12,
    progress_unit: "episode",
    consumption_format: "digital",
    rating: 8.5,
    synopsis: "Demo anime entry with progress for the continue rail.",
    review_body: "Sample review — not a real title.",
    cover:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Le_Voyage_dans_la_lune.jpg/500px-Le_Voyage_dans_la_lune.jpg",
    genres: ["Sci-Fi", "Adventure"],
  },
  {
    title: "Sample: A Trip to the Moon",
    media_type: "movie",
    status: "completed",
    progress_current: 1,
    progress_total: 1,
    progress_unit: "minute",
    consumption_format: "digital",
    rating: 9.0,
    started_on: "2026-01-10",
    finished_on: "2026-01-10",
    synopsis: "Public-domain Méliès still used as a sample movie poster.",
    cover:
      "https://upload.wikimedia.org/wikipedia/commons/0/04/Le_Voyage_dans_la_lune.jpg",
    genres: ["Classic", "Fantasy"],
  },
  {
    title: "Sample: Harbor Nights",
    media_type: "series",
    status: "on_hold",
    progress_current: 2,
    progress_total: 8,
    progress_unit: "episode",
    consumption_format: "digital",
    rating: 7.0,
    synopsis: "Demo series on hold.",
    cover:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/500px-The_Great_Wave_off_Kanagawa.jpg",
    genres: ["Drama"],
  },
  {
    title: "Sample: Bound Pages",
    media_type: "manga",
    status: "reading",
    progress_current: 18,
    progress_total: 40,
    progress_unit: "chapter",
    consumption_format: "physical",
    volume_current: 2,
    volume_total: 5,
    rating: 8.0,
    synopsis: "Demo manga with volume tracking.",
    cover:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/500px-Tsunami_by_hokusai_19th_century.jpg",
    genres: ["Fantasy"],
  },
  {
    title: "Sample: Quiet Chapters",
    media_type: "novel",
    status: "plan_to_read",
    progress_current: 0,
    progress_total: 320,
    progress_unit: "page",
    consumption_format: "digital",
    synopsis: "Demo novel on the plan-to-read list.",
    // DiceBear CC0 decorative poster (Wikimedia thumbs often 400 for alternate paths)
    cover: "https://api.dicebear.com/9.x/shapes/png?seed=QuietChapters&size=512",
    genres: ["Literary"],
  },
  {
    title: "Sample: Ink Rain",
    media_type: "manhwa",
    status: "dropped",
    progress_current: 6,
    progress_total: 50,
    progress_unit: "chapter",
    consumption_format: "digital",
    rating: 5.5,
    synopsis: "Demo manhwa marked dropped.",
    cover: "https://api.dicebear.com/9.x/shapes/png?seed=InkRain&size=512",
    genres: ["Action"],
  },
];

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

function cliToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  try {
    return execSync(
      'security find-generic-password -s "Supabase CLI" -w',
      { encoding: "utf8" },
    ).trim();
  } catch {
    throw new Error(
      "No Supabase CLI token. Sign in with the Supabase CLI or set SUPABASE_ACCESS_TOKEN.",
    );
  }
}

async function fetchServiceRole(token, projectRef) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`api-keys failed: ${res.status} ${await res.text()}`);
  }
  const keys = await res.json();
  const row = keys.find((k) => k.name === "service_role" || k.id === "service_role");
  if (!row?.api_key) throw new Error("service_role key not found in Management API");
  return row.api_key;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "MediaCriticSeed/1.0 (personal demo; +https://github.com/AkhanshaSen/Media-Critic)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) {
    throw new Error(`image too large (${buf.length} bytes): ${url}`);
  }
  const ct = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  const mime = ct.startsWith("image/") ? ct : "image/jpeg";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { buf, mime, ext };
}

async function ensureGenre(supabase, name) {
  const { data: existing } = await supabase
    .from("genres")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase
    .from("genres")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw new Error(`genre insert ${name}: ${error.message}`);
  return data.id;
}

async function pickUser(supabase) {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, display_name")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`list users: ${error.message}`);
  if (!users?.length) {
    throw new Error("No public.users rows. Sign in to Media Critic once, then re-run.");
  }
  if (users.length === 1) return users[0];

  const { data: counts } = await supabase.from("media_entries").select("user_id");
  const tally = new Map();
  for (const row of counts || []) {
    tally.set(row.user_id, (tally.get(row.user_id) || 0) + 1);
  }
  const preferred = [...users].sort(
    (a, b) => (tally.get(b.id) || 0) - (tally.get(a.id) || 0),
  )[0];
  console.log(
    `Multiple users; seeding ${preferred.email || preferred.id} (most media_entries).`,
  );
  return preferred;
}

async function clearPreviousSample(supabase, userId) {
  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .eq("name", SAMPLE_TAG)
    .maybeSingle();
  if (!tag?.id) return;

  const { data: links } = await supabase
    .from("entry_tags")
    .select("entry_id")
    .eq("tag_id", tag.id);
  const entryIds = (links || []).map((l) => l.entry_id);
  if (entryIds.length === 0) return;

  const { data: imgs } = await supabase
    .from("images")
    .select("storage_path")
    .in("entry_id", entryIds);
  const paths = (imgs || []).map((i) => i.storage_path).filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("media_entries")
    .delete()
    .in("id", entryIds)
    .eq("user_id", userId);
  if (error) throw new Error(`delete previous sample: ${error.message}`);
  console.log(`Removed ${entryIds.length} previous sample-seed entries.`);
}

async function main() {
  loadEnvLocal();
  const projectRef = projectRefFromEnv();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const token = cliToken();
  const serviceRole = await fetchServiceRole(token, projectRef);
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const user = await pickUser(supabase);
  console.log(`Seeding for ${user.email || user.id}`);

  await clearPreviousSample(supabase, user.id);

  let sampleTagId;
  {
    const { data: existingTag } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", SAMPLE_TAG)
      .maybeSingle();
    if (existingTag?.id) {
      sampleTagId = existingTag.id;
    } else {
      const { data: tagRow, error: tagErr } = await supabase
        .from("tags")
        .insert({ user_id: user.id, name: SAMPLE_TAG })
        .select("id")
        .single();
      if (tagErr || !tagRow) throw new Error(`tag: ${tagErr?.message}`);
      sampleTagId = tagRow.id;
    }
  }

  const { error: avatarErr } = await supabase
    .from("users")
    .update({ avatar_url: AVATAR_URL })
    .eq("id", user.id);
  if (avatarErr) throw new Error(`avatar: ${avatarErr.message}`);
  console.log("Set profile avatar_url (DiceBear CC0).");

  for (const sample of SAMPLES) {
    const entryId = randomUUID();
    const imageId = randomUUID();
    const { buf, mime, ext } = await downloadImage(sample.cover);
    const storagePath = `${user.id}/${entryId}/${randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buf, { contentType: mime, upsert: false });
    if (upErr) throw new Error(`upload ${sample.title}: ${upErr.message}`);

    const row = {
      id: entryId,
      user_id: user.id,
      title: sample.title,
      media_type: sample.media_type,
      external_source: "manual",
      status: sample.status,
      progress_current: sample.progress_current ?? 0,
      progress_total: sample.progress_total ?? null,
      progress_unit: sample.progress_unit ?? null,
      consumption_format: sample.consumption_format ?? "digital",
      volume_current: sample.volume_current ?? null,
      volume_total: sample.volume_total ?? null,
      rating: sample.rating ?? null,
      synopsis: sample.synopsis ?? null,
      review_body: sample.review_body ?? null,
      started_on: sample.started_on ?? null,
      finished_on: sample.finished_on ?? null,
      is_public: false,
      has_spoilers: false,
    };

    const { error: insErr } = await supabase.from("media_entries").insert(row);
    if (insErr) throw new Error(`entry ${sample.title}: ${insErr.message}`);

    const { error: imgErr } = await supabase.from("images").insert({
      id: imageId,
      user_id: user.id,
      entry_id: entryId,
      storage_path: storagePath,
      sort_order: 0,
      is_cover: true,
    });
    if (imgErr) throw new Error(`image ${sample.title}: ${imgErr.message}`);

    const { error: linkErr } = await supabase
      .from("media_entries")
      .update({ cover_image_id: imageId })
      .eq("id", entryId);
    if (linkErr) throw new Error(`cover link ${sample.title}: ${linkErr.message}`);

    await supabase.from("entry_tags").insert({
      entry_id: entryId,
      tag_id: sampleTagId,
    });

    for (const g of sample.genres || []) {
      const genreId = await ensureGenre(supabase, g);
      await supabase
        .from("entry_genres")
        .upsert({ entry_id: entryId, genre_id: genreId });
    }

    console.log(`✓ ${sample.title}`);
  }

  console.log("Done. Sign in as that user and open /dashboard/ to see covers + avatar.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
