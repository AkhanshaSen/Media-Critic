-- Always-show-spoilers preference on user_settings
-- Paste into: https://supabase.com/dashboard/project/xxxxxxxx/sql/new
-- Run AFTER 20261109000006_page_template.sql

alter table public.user_settings
  add column if not exists always_show_spoilers boolean not null default false;
