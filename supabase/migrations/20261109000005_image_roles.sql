-- Poster vs backdrop vs stills for entry images
-- Paste into: https://supabase.com/dashboard/project/xxxxxxxx/sql/new
-- Run AFTER 20261109000004_progress_format.sql

do $$ begin
  create type public.image_role as enum ('poster', 'backdrop', 'still');
exception when duplicate_object then null;
end $$;

alter table public.images
  add column if not exists role public.image_role not null default 'still';

-- Existing covers become posters
update public.images
set role = 'poster'
where is_cover = true
  and role = 'still';

alter table public.media_entries
  add column if not exists backdrop_image_id uuid;

do $$ begin
  alter table public.media_entries
    add constraint media_entries_backdrop_image_id_fkey
    foreign key (backdrop_image_id) references public.images (id) on delete set null;
exception when duplicate_object then null;
end $$;

create unique index if not exists images_one_poster_per_entry
  on public.images (entry_id)
  where (role = 'poster');

create unique index if not exists images_one_backdrop_per_entry
  on public.images (entry_id)
  where (role = 'backdrop');
