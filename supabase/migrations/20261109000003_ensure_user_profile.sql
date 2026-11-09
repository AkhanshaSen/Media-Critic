-- Ensure every auth.users row has public.users + user_settings
-- Paste into: https://supabase.com/dashboard/project/xxxxxxxx/sql/new
-- Run AFTER 20261109000002_restore_auth_rls.sql
--
-- Fixes accounts created in Auth before the profile trigger existed,
-- and exposes ensure_user_profile() for the app to call after sign-in.

-- Shared profile creator (reads auth.users; SECURITY DEFINER bypasses RLS)
create or replace function public.create_profile_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  au auth.users%rowtype;
  base_handle text;
  candidate text;
  suffix integer := 0;
begin
  if p_user_id is null then
    raise exception 'create_profile_for_user: user id required';
  end if;

  select * into au from auth.users where id = p_user_id;
  if not found then
    raise exception 'create_profile_for_user: auth user % not found', p_user_id;
  end if;

  if exists (select 1 from public.users where id = p_user_id) then
    update public.users
    set
      email = coalesce(au.email, public.users.email),
      avatar_url = coalesce(
        public.users.avatar_url,
        au.raw_user_meta_data ->> 'avatar_url'
      )
    where id = p_user_id;

    insert into public.user_settings (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

    return;
  end if;

  base_handle := lower(
    regexp_replace(
      split_part(coalesce(au.email, 'user'), '@', 1),
      '[^a-z0-9_]',
      '',
      'g'
    )
  );

  if length(base_handle) < 3 then
    base_handle := 'user' || substr(replace(p_user_id::text, '-', ''), 1, 6);
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
    p_user_id,
    coalesce(au.email, ''),
    coalesce(
      au.raw_user_meta_data ->> 'full_name',
      au.raw_user_meta_data ->> 'name',
      split_part(coalesce(au.email, 'User'), '@', 1)
    ),
    candidate,
    au.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);

  insert into public.user_settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Re-assert signup trigger (uses shared helper)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_profile_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Callable by signed-in clients after Google / magic-link session
create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'ensure_user_profile: not authenticated';
  end if;

  perform public.create_profile_for_user(auth.uid());
end;
$$;

revoke all on function public.create_profile_for_user(uuid) from public;
revoke all on function public.ensure_user_profile() from public;

grant execute on function public.ensure_user_profile() to authenticated;
-- Keep create_profile_for_user callable only by definer / superuser (trigger + ensure)

-- One-time backfill for Auth users missing public profiles
do $$
declare
  r record;
begin
  for r in
    select u.id
    from auth.users u
    where not exists (select 1 from public.users p where p.id = u.id)
  loop
    perform public.create_profile_for_user(r.id);
  end loop;

  -- Settings for any profile that somehow lacks them
  insert into public.user_settings (user_id)
  select p.id
  from public.users p
  where not exists (
    select 1 from public.user_settings s where s.user_id = p.id
  )
  on conflict (user_id) do nothing;
end;
$$;
