# Security (GitHub Pages + open auth)

Media Critic is hosted as a **static** site on GitHub Pages. The browser talks to Supabase with the **publishable/anon** key. Access control is **Auth (Google or email magic link) + RLS**, not “hide the URL.”

The **anon key in the client is expected**. Do not try to “hide” it; keep `service_role` and DB passwords out of this app and out of git.

## Personal-scale checklist (no paid add-ons)

### We do (app / repo)

| Item | How |
| --- | --- |
| Hide secrets | Only `NEXT_PUBLIC_SUPABASE_*` in the client; never `service_role`. Build secrets live in GitHub Actions, not committed files. |
| Passwords / `.env` off GitHub | `.env.local` is gitignored; `npm run security:check` fails if it is tracked. SQL migrations are schema, not secrets—keep them in the repo. |
| Proper login | Supabase Auth (Google OAuth + email magic link), not custom password storage. |
| Users see only their data | RLS `user_id = auth.uid()` via migration `00002`. Writes set `user_id` from the session. |
| Check forms | Zod on the client; UUID checks + `escapeIlike`; PostgREST parameterized queries; reviews as plain text (no `dangerouslySetInnerHTML`). |
| HTTPS | GitHub Pages + Supabase API (TLS). |
| Generic errors | User-facing copy only; no raw Auth/DB dumps in the UI. |
| No debug / unused admin | Static export; no production source maps; no `/admin` route. |
| Update packages + scan | `npm run security:check` (audit high+, lint, build, secret patterns). CI runs the same checks without a double build. |

### Supabase / platform handles

| Item | Where |
| --- | --- |
| Password hashing | Supabase Auth (you do not store app passwords). |
| Login rate limits | Dashboard → Authentication → rate limits / abuse controls. |
| Lock the database | Hosted Postgres; no public DB port—API + RLS only. |
| Security Advisor | Dashboard → Advisors (free); fix **errors** before public push. |

### Not applicable at this scale

| Item | Why |
| --- | --- |
| Admin page RBAC | No in-app admin UI. Use the Supabase Dashboard (your Google/account login). Stats/Settings nav items stay disabled. |
| Custom Argon2 / bcrypt in-app | No local password table. |
| Paid daily PITR / WAF / custom rate-limit API | Out of scope; free-tier backups are limited—export a SQL dump occasionally if you care about recovery. |

### You verify once (Dashboard)

- [ ] Production DB has **`00002` + `00003`** (+ **`00004`** if using progress units). **`00001` anonymous open RLS must not be left on** a public deploy.
- [ ] Auth redirect URLs include GHP `…/Media-Critic/auth/callback/` (and localhost for dev).
- [ ] Auth rate limits enabled / reviewed.
- [ ] Security Advisor: address **errors**.
- [ ] IDOR smoke test: user A cannot read user B’s entry by id.
- [ ] If a Google OAuth **client secret** was ever pasted into chat or a ticket, **rotate it** in Google Cloud Console (free).

### Avoid (red)

- Verbose debug / stack traces in production (static export already avoids server dumps).
- Raw system or database error strings in the UI.
- Leaving dead open-RLS (`00001`) or hidden test endpoints that bypass owner policies.

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
6. Image roles: `20261109000005_image_roles.sql` (poster / backdrop / still + `backdrop_image_id`)

## Safety script (not full VAPT)

```bash
npm run security:check
```

Runs audit (high+), lint, static build, scans `src/` for secrets / `dangerouslySetInnerHTML`, checks `.env.local` is untracked.

CI uses `SKIP_BUILD=1` so the deploy job does not build twice.

For deeper testing before a public launch: Supabase Security Advisor + optional OWASP ZAP against the GHP URL.

## Pre-deploy checklist

- [ ] `00002` RLS + `00003` profile migrations applied
- [ ] Google + Email providers enabled; redirect URLs set for GHP
- [ ] GitHub Actions secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Repo variable `NEXT_PUBLIC_BASE_PATH` matches repo name
- [ ] `npm run security:check` locally
- [ ] Sign in (Google or magic link) and create one entry; confirm a `public.users` row exists
- [ ] IDOR smoke test + Security Advisor errors cleared
