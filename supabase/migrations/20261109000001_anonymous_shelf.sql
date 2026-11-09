-- =============================================================================
-- DEV ONLY — DO NOT LEAVE ON A PUBLIC / GITHUB PAGES DEPLOY
-- =============================================================================
-- Anonymous personal shelf (no login required). Opens RLS so anon can
-- read/write all shelf rows. After local experiments, run
-- 20261109000002_restore_auth_rls.sql before any public URL.
-- =============================================================================
-- Paste into: https://supabase.com/dashboard/project/kaiffjdbfjkjqisumklh/sql/new
-- Run AFTER 20261109000000_init.sql
--
-- WARNING: anon clients can read/write all shelf rows. Fine for localhost / personal use.
-- Do not expose a public deploy without auth or another gate.

-- Allow entries without an auth user
alter table public.media_entries
  alter column user_id drop not null;

-- Tags may be shared on the anonymous shelf (no per-user owner)
alter table public.tags
  alter column user_id drop not null;

alter table public.images
  alter column user_id drop not null;

-- Drop ownership-scoped policies on shelf tables
drop policy if exists "media_entries_select_own_or_public" on public.media_entries;
drop policy if exists "media_entries_insert_own" on public.media_entries;
drop policy if exists "media_entries_update_own" on public.media_entries;
drop policy if exists "media_entries_delete_own" on public.media_entries;

drop policy if exists "entry_genres_select_own_or_public" on public.entry_genres;
drop policy if exists "entry_genres_insert_own" on public.entry_genres;
drop policy if exists "entry_genres_delete_own" on public.entry_genres;

drop policy if exists "tags_select_own" on public.tags;
drop policy if exists "tags_insert_own" on public.tags;
drop policy if exists "tags_update_own" on public.tags;
drop policy if exists "tags_delete_own" on public.tags;

drop policy if exists "entry_tags_select_own_or_public" on public.entry_tags;
drop policy if exists "entry_tags_insert_own" on public.entry_tags;
drop policy if exists "entry_tags_delete_own" on public.entry_tags;

drop policy if exists "images_select_own_or_public" on public.images;
drop policy if exists "images_insert_own" on public.images;
drop policy if exists "images_update_own" on public.images;
drop policy if exists "images_delete_own" on public.images;

drop policy if exists "share_events_select_own" on public.share_events;
drop policy if exists "share_events_insert_own" on public.share_events;

-- Open shelf policies (anon + authenticated)
create policy "media_entries_anon_all"
  on public.media_entries for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "entry_genres_anon_all"
  on public.entry_genres for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "tags_anon_all"
  on public.tags for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "entry_tags_anon_all"
  on public.entry_tags for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "images_anon_all"
  on public.images for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "share_events_anon_all"
  on public.share_events for all
  to anon, authenticated
  using (true)
  with check (true);

-- Reference data: allow anon inserts/updates too (personal shelf autofill later)
drop policy if exists "catalog_titles_insert_authenticated" on public.catalog_titles;
drop policy if exists "catalog_titles_update_authenticated" on public.catalog_titles;
drop policy if exists "genres_insert_authenticated" on public.genres;
drop policy if exists "genres_update_authenticated" on public.genres;

create policy "catalog_titles_write_anon"
  on public.catalog_titles for insert
  to anon, authenticated
  with check (true);

create policy "catalog_titles_update_anon"
  on public.catalog_titles for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "genres_write_anon"
  on public.genres for insert
  to anon, authenticated
  with check (true);

create policy "genres_update_anon"
  on public.genres for update
  to anon, authenticated
  using (true)
  with check (true);

-- Grants for anon mutations
grant select, insert, update, delete on table public.media_entries to anon;
grant select, insert, delete on table public.entry_genres to anon;
grant select, insert, update, delete on table public.tags to anon;
grant select, insert, delete on table public.entry_tags to anon;
grant select, insert, update, delete on table public.images to anon;
grant select, insert on table public.share_events to anon;
grant insert, update on table public.catalog_titles to anon;
grant insert, update on table public.genres to anon;
