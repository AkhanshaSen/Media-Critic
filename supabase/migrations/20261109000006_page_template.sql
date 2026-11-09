-- Per-entry page layout template (cinematic / magazine / minimal)
-- Paste into: https://supabase.com/dashboard/project/xxxxxxxx/sql/new
-- Run AFTER 20261109000005_image_roles.sql

alter table public.media_entries
  add column if not exists page_template text not null default 'cinematic';

do $$ begin
  alter table public.media_entries
    add constraint media_entries_page_template_check
    check (page_template in ('cinematic', 'magazine', 'minimal'));
exception when duplicate_object then null;
end $$;
