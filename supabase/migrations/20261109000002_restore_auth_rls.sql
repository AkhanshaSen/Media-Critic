-- Restore owner-only RLS for Google-auth / GitHub Pages public deploy
-- Paste into: https://supabase.com/dashboard/project/kaiffjdbfjkjqisumklh/sql/new
-- Run AFTER 20261109000001 (or whenever you leave anonymous mode)
--
-- Deletes anonymous open policies and restores user_id = auth.uid() rules.

-- Drop anonymous policies
drop policy if exists "media_entries_anon_all" on public.media_entries;
drop policy if exists "entry_genres_anon_all" on public.entry_genres;
drop policy if exists "tags_anon_all" on public.tags;
drop policy if exists "entry_tags_anon_all" on public.entry_tags;
drop policy if exists "images_anon_all" on public.images;
drop policy if exists "share_events_anon_all" on public.share_events;
drop policy if exists "catalog_titles_write_anon" on public.catalog_titles;
drop policy if exists "catalog_titles_update_anon" on public.catalog_titles;
drop policy if exists "genres_write_anon" on public.genres;
drop policy if exists "genres_update_anon" on public.genres;

-- Remove orphan anonymous rows (optional cleanup) so NOT NULL can apply
delete from public.media_entries where user_id is null;
delete from public.tags where user_id is null;
delete from public.images where user_id is null;

-- Require owners again
alter table public.media_entries
  alter column user_id set not null;

alter table public.tags
  alter column user_id set not null;

alter table public.images
  alter column user_id set not null;

-- media_entries owner policies
drop policy if exists "media_entries_select_own_or_public" on public.media_entries;
create policy "media_entries_select_own_or_public"
  on public.media_entries for select
  using (user_id = auth.uid() or is_public = true);

drop policy if exists "media_entries_insert_own" on public.media_entries;
create policy "media_entries_insert_own"
  on public.media_entries for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "media_entries_update_own" on public.media_entries;
create policy "media_entries_update_own"
  on public.media_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "media_entries_delete_own" on public.media_entries;
create policy "media_entries_delete_own"
  on public.media_entries for delete
  to authenticated
  using (user_id = auth.uid());

-- entry_genres
drop policy if exists "entry_genres_select_own_or_public" on public.entry_genres;
create policy "entry_genres_select_own_or_public"
  on public.entry_genres for select
  using (
    public.owns_entry(entry_id) or public.entry_is_public(entry_id)
  );

drop policy if exists "entry_genres_insert_own" on public.entry_genres;
create policy "entry_genres_insert_own"
  on public.entry_genres for insert
  to authenticated
  with check (public.owns_entry(entry_id));

drop policy if exists "entry_genres_delete_own" on public.entry_genres;
create policy "entry_genres_delete_own"
  on public.entry_genres for delete
  to authenticated
  using (public.owns_entry(entry_id));

-- tags
drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own"
  on public.tags for select
  using (user_id = auth.uid());

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own"
  on public.tags for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own"
  on public.tags for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own"
  on public.tags for delete
  to authenticated
  using (user_id = auth.uid());

-- entry_tags
drop policy if exists "entry_tags_select_own_or_public" on public.entry_tags;
create policy "entry_tags_select_own_or_public"
  on public.entry_tags for select
  using (
    public.owns_entry(entry_id) or public.entry_is_public(entry_id)
  );

drop policy if exists "entry_tags_insert_own" on public.entry_tags;
create policy "entry_tags_insert_own"
  on public.entry_tags for insert
  to authenticated
  with check (public.owns_entry(entry_id));

drop policy if exists "entry_tags_delete_own" on public.entry_tags;
create policy "entry_tags_delete_own"
  on public.entry_tags for delete
  to authenticated
  using (public.owns_entry(entry_id));

-- images
drop policy if exists "images_select_own_or_public" on public.images;
create policy "images_select_own_or_public"
  on public.images for select
  using (
    user_id = auth.uid() or public.entry_is_public(entry_id)
  );

drop policy if exists "images_insert_own" on public.images;
create policy "images_insert_own"
  on public.images for insert
  to authenticated
  with check (
    user_id = auth.uid() and public.owns_entry(entry_id)
  );

drop policy if exists "images_update_own" on public.images;
create policy "images_update_own"
  on public.images for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and public.owns_entry(entry_id)
  );

drop policy if exists "images_delete_own" on public.images;
create policy "images_delete_own"
  on public.images for delete
  to authenticated
  using (user_id = auth.uid());

-- share_events
drop policy if exists "share_events_select_own" on public.share_events;
create policy "share_events_select_own"
  on public.share_events for select
  using (user_id = auth.uid());

drop policy if exists "share_events_insert_own" on public.share_events;
create policy "share_events_insert_own"
  on public.share_events for insert
  to authenticated
  with check (
    user_id = auth.uid() and public.owns_entry(entry_id)
  );

-- catalog / genres: authenticated write only (again)
drop policy if exists "catalog_titles_insert_authenticated" on public.catalog_titles;
create policy "catalog_titles_insert_authenticated"
  on public.catalog_titles for insert
  to authenticated
  with check (true);

drop policy if exists "catalog_titles_update_authenticated" on public.catalog_titles;
create policy "catalog_titles_update_authenticated"
  on public.catalog_titles for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "genres_insert_authenticated" on public.genres;
create policy "genres_insert_authenticated"
  on public.genres for insert
  to authenticated
  with check (true);

drop policy if exists "genres_update_authenticated" on public.genres;
create policy "genres_update_authenticated"
  on public.genres for update
  to authenticated
  using (true)
  with check (true);

-- Tighten anon grants (read public catalog/genres only; no shelf mutations)
revoke insert, update, delete on table public.media_entries from anon;
revoke insert, delete on table public.entry_genres from anon;
revoke insert, update, delete on table public.tags from anon;
revoke insert, delete on table public.entry_tags from anon;
revoke insert, update, delete on table public.images from anon;
revoke insert on table public.share_events from anon;
revoke insert, update on table public.catalog_titles from anon;
revoke insert, update on table public.genres from anon;

-- Anon may still SELECT public media_entries (is_public) via RLS
grant select on table public.media_entries to anon;
