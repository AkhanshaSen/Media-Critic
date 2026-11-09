-- Media Critic initial schema
-- Paste into: https://supabase.com/dashboard/project/xxxxxxxx/sql/new

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.media_type as enum (
    'anime',
    'movie',
    'series',
    'manga',
    'manhwa',
    'manhua',
    'novel'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.external_source as enum (
    'jikan',
    'anilist',
    'tmdb',
    'manual'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_status as enum (
    'watching',
    'reading',
    'completed',
    'plan_to_watch',
    'plan_to_read',
    'on_hold',
    'dropped'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.share_channel as enum (
    'copy_text',
    'download_png',
    'clipboard_image',
    'web_share',
    'x',
    'whatsapp',
    'reddit',
    'telegram',
    'other'
  );
exception when duplicate_object then null;
end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  handle text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint users_handle_format check (
    handle is null or handle ~ '^[a-zA-Z0-9_]{3,32}$'
  )
);

create unique index if not exists users_handle_lower_uidx
  on public.users (lower(handle))
  where handle is not null;

-- Per-user settings (created with the profile)
create table if not exists public.user_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  theme text not null default 'system'
    check (theme in ('dark', 'light', 'system')),
  rating_step numeric(2, 1) not null default 0.5
    check (rating_step in (0.5, 1.0)),
  default_share_template text not null default 'minimal_dark',
  default_share_size text not null default 'square',
  share_include_emoji boolean not null default true,
  share_include_hashtags boolean not null default true,
  share_include_link boolean not null default false,
  watermark_enabled boolean not null default true,
  review_soft_limit integer not null default 2000,
  updated_at timestamptz not null default now()
);

-- Canonical titles (future community aggregation)
create table if not exists public.catalog_titles (
  id uuid primary key default gen_random_uuid(),
  media_type public.media_type not null,
  external_source public.external_source not null default 'manual',
  external_id text,
  title text not null,
  original_title text,
  year integer,
  synopsis text,
  cover_url text,
  created_at timestamptz not null default now(),
  constraint catalog_titles_external_unique unique (external_source, external_id)
);

-- Shared genre vocabulary (case-insensitive name via index — not inline UNIQUE on expression)
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create unique index if not exists genres_name_lower_uidx
  on public.genres (lower(name));

-- User media log entries
create table if not exists public.media_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  catalog_title_id uuid references public.catalog_titles (id) on delete set null,
  title text not null,
  original_title text,
  media_type public.media_type not null,
  external_source public.external_source not null default 'manual',
  external_id text,
  year integer,
  season text,
  synopsis text,
  status public.entry_status not null default 'plan_to_watch',
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_total integer check (progress_total is null or progress_total >= 0),
  rating numeric(3, 1) check (rating is null or (rating >= 1 and rating <= 10)),
  review_title text,
  review_body text,
  verdict varchar(120),
  has_spoilers boolean not null default false,
  started_on date,
  finished_on date,
  repeat_count integer not null default 0 check (repeat_count >= 0),
  source_link text,
  cover_image_id uuid,
  is_public boolean not null default false,
  public_slug text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(original_title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(review_title, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(verdict, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_entries_public_slug_unique unique (public_slug),
  constraint media_entries_public_slug_required check (
    (is_public = false and public_slug is null)
    or (is_public = true and public_slug is not null)
  )
);

create index if not exists media_entries_user_type_status_idx
  on public.media_entries (user_id, media_type, status);

create index if not exists media_entries_user_rating_idx
  on public.media_entries (user_id, rating);

create index if not exists media_entries_search_vector_idx
  on public.media_entries using gin (search_vector);

create index if not exists media_entries_user_updated_idx
  on public.media_entries (user_id, updated_at desc);

-- Entry genres
create table if not exists public.entry_genres (
  entry_id uuid not null references public.media_entries (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (entry_id, genre_id)
);

-- Personal tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_user_name_unique unique (user_id, name)
);

create table if not exists public.entry_tags (
  entry_id uuid not null references public.media_entries (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (entry_id, tag_id)
);

-- Images (cover FK added after both tables exist)
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  entry_id uuid not null references public.media_entries (id) on delete cascade,
  storage_path text not null,
  width integer,
  height integer,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists images_entry_sort_idx
  on public.images (entry_id, sort_order);

do $$ begin
  alter table public.media_entries
    add constraint media_entries_cover_image_id_fkey
    foreign key (cover_image_id) references public.images (id) on delete set null;
exception when duplicate_object then null;
end $$;

-- Optional share analytics
create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.media_entries (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  channel public.share_channel not null,
  template text,
  created_at timestamptz not null default now()
);

create index if not exists share_events_entry_idx
  on public.share_events (entry_id, created_at desc);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_entries_set_updated_at on public.media_entries;
create trigger media_entries_set_updated_at
  before update on public.media_entries
  for each row
  execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();

-- Auto-create profile + settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate text;
  suffix integer := 0;
begin
  base_handle := lower(
    regexp_replace(
      split_part(coalesce(new.email, 'user'), '@', 1),
      '[^a-z0-9_]',
      '',
      'g'
    )
  );

  if length(base_handle) < 3 then
    base_handle := 'user' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  base_handle := left(base_handle, 24);
  candidate := base_handle;

  while exists (
    select 1 from public.users where lower(handle) = candidate
  ) loop
    suffix := suffix + 1;
    candidate := left(base_handle, 24 - length(suffix::text)) || suffix::text;
  end loop;

  insert into public.users (id, email, display_name, handle, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'User'), '@', 1)
    ),
    candidate,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Ownership helpers for nested tables
create or replace function public.owns_entry(p_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media_entries e
    where e.id = p_entry_id
      and e.user_id = auth.uid()
  );
$$;

create or replace function public.entry_is_public(p_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media_entries e
    where e.id = p_entry_id
      and e.is_public = true
  );
$$;

-- Row Level Security
alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.catalog_titles enable row level security;
alter table public.genres enable row level security;
alter table public.media_entries enable row level security;
alter table public.entry_genres enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.images enable row level security;
alter table public.share_events enable row level security;

-- users
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- user_settings
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (user_id = auth.uid());

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (user_id = auth.uid());

-- catalog_titles (shared reference)
drop policy if exists "catalog_titles_select_all" on public.catalog_titles;
create policy "catalog_titles_select_all"
  on public.catalog_titles for select
  to anon, authenticated
  using (true);

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

-- genres (shared reference)
drop policy if exists "genres_select_all" on public.genres;
create policy "genres_select_all"
  on public.genres for select
  to anon, authenticated
  using (true);

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

-- media_entries
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

-- Grants
grant usage on schema public to anon, authenticated;

grant select on table public.catalog_titles to anon, authenticated;
grant insert, update on table public.catalog_titles to authenticated;

grant select on table public.genres to anon, authenticated;
grant insert, update on table public.genres to authenticated;

grant select on table public.users to authenticated;
grant update on table public.users to authenticated;

grant select, insert, update on table public.user_settings to authenticated;

grant select on table public.media_entries to anon, authenticated;
grant insert, update, delete on table public.media_entries to authenticated;

grant select on table public.entry_genres to anon, authenticated;
grant insert, delete on table public.entry_genres to authenticated;

grant select, insert, update, delete on table public.tags to authenticated;

grant select on table public.entry_tags to anon, authenticated;
grant insert, delete on table public.entry_tags to authenticated;

grant select on table public.images to anon, authenticated;
grant insert, update, delete on table public.images to authenticated;

grant select, insert on table public.share_events to authenticated;

-- Storage bucket for entry images (private, 5 MB, jpeg/png/webp)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-images',
  'entry-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "entry_images_select_own" on storage.objects;
create policy "entry_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_images_insert_own" on storage.objects;
create policy "entry_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_images_update_own" on storage.objects;
create policy "entry_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_images_delete_own" on storage.objects;
create policy "entry_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
