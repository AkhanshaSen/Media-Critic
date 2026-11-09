-- Progress units, consumption format, volume tracking for print manga/books
-- Paste into: https://supabase.com/dashboard/project/xxxxxxxx/sql/new
-- Run AFTER 20261109000003_ensure_user_profile.sql

do $$ begin
  create type public.progress_unit as enum ('episode', 'chapter', 'page', 'minute');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.consumption_format as enum ('digital', 'physical', 'mixed');
exception when duplicate_object then null;
end $$;

alter table public.media_entries
  add column if not exists progress_unit public.progress_unit,
  add column if not exists consumption_format public.consumption_format not null default 'digital',
  add column if not exists volume_current integer,
  add column if not exists volume_total integer;

do $$ begin
  alter table public.media_entries
    add constraint media_entries_volume_current_check
    check (volume_current is null or volume_current >= 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.media_entries
    add constraint media_entries_volume_total_check
    check (volume_total is null or volume_total >= 0);
exception when duplicate_object then null;
end $$;

-- Ensure existing rows have a consumption format
update public.media_entries
set consumption_format = 'digital'
where consumption_format is null;
