# Security (GitHub Pages + open auth)

Media Critic is hosted as a **static** site on GitHub Pages. The browser talks to Supabase with the **publishable/anon** key. Access control is **Auth (Google or email magic link) + RLS**, not “hide the URL.”

## Open signup on a public URL

Sign-up is **open**: any Google account or email can create a shelf. That is intentional.

- Each user’s rows are scoped with `user_id = auth.uid()` (migration `20261109000002_restore_auth_rls.sql`).
- **Do not** leave anonymous open RLS (`00001`) on a public deploy.
- Profiles live in `public.users` / `public.user_settings` (created by trigger + `ensure_user_profile` in `00003`).
- Still **never** put `service_role` or DB passwords in the frontend.

Auth emails (magic links) can count toward Supabase free-tier email limits if traffic grows.

## Is no-auth OK for “only me”?

**No on a public GitHub Pages URL.** Anonymous open RLS lets anyone with the site edit data.

**Yes with sign-in + owner RLS:** only that user’s `auth.uid()` can read/write their private rows.

## SQL injection

Risk stays **low** while you:

- Use only the Supabase JS client (parameterized PostgREST)
- Validate with Zod before insert/update
- Check UUIDs before get/update/delete
- Escape `%` / `_` in `ilike` search (`escapeIlike` in `src/features/entries/data.ts`)
- Never add raw SQL or `service_role` in the frontend

Reviews render as plain text (no `dangerouslySetInnerHTML`).

## Environment

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon only |
| `NEXT_PUBLIC_BASE_PATH` | e.g. `/Media-Critic` for project Pages |
| `service_role` | **Never** in this app |

## Auth (you configure)

1. Supabase **Auth → Providers → Google** and **Email** enabled
2. Site URL / Redirect URLs = your GHP origin + base path + `/auth/callback/` (and localhost for dev)
3. Google Cloud OAuth client authorized redirect = Supabase callback URL
4. Do **not** leave Site URL pointing only at another project (e.g. The-Scroll) without Media Critic URLs

## Database migrations (order)

1. `20261109000000_init.sql`
2. Optional temporary: `20261109000001_anonymous_shelf.sql` (localhost only — **do not leave on public**)
3. **Required for public GHP:** `20261109000002_restore_auth_rls.sql`
4. **Required for profiles:** `20261109000003_ensure_user_profile.sql` (backfill + `ensure_user_profile` RPC)
5. Progress format: `20261109000004_progress_format.sql` (unit, digital/physical, volumes)

## Safety script (not full VAPT)

```bash
npm run security:check
```

Runs audit (high+), lint, static build, scans `src/` for secrets / `dangerouslySetInnerHTML`, checks `.env.local` is untracked.

For deeper testing before a public launch: Supabase Security Advisor + optional OWASP ZAP against the GHP URL.

## Pre-deploy checklist

- [ ] `00002` RLS + `00003` profile migrations applied
- [ ] Google + Email providers enabled; redirect URLs set for GHP
- [ ] GitHub Actions secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Repo variable `NEXT_PUBLIC_BASE_PATH` matches repo name
- [ ] `npm run security:check` locally
- [ ] Sign in (Google or magic link) and create one entry; confirm a `public.users` row exists
