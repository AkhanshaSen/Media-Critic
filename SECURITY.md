# Security (GitHub Pages + Google auth)

Media Critic is a **solo personal shelf** hosted as a **static** site on GitHub Pages. The browser talks to Supabase with the **publishable/anon** key. Access control is **Google Auth + RLS**, not “hide the URL.”

## Is no-auth OK for “only me”?

**No on a public GitHub Pages URL.** Anonymous open RLS lets anyone with the site edit your shelf.

**Yes with Google sign-in + owner RLS** (migration `20261109000002_restore_auth_rls.sql`): only your Google account’s `auth.uid()` can read/write your rows.

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
| `NEXT_PUBLIC_BASE_PATH` | e.g. `/MEDIA-CRITIC` for project Pages |
| `service_role` | **Never** in this app |

## Auth (you configure)

1. Supabase **Auth → Providers → Google** enabled
2. Site URL / Redirect URLs = your GHP origin + base path + `/auth/callback/`
3. Google Cloud OAuth client authorized redirect = Supabase callback URL
4. Do **not** leave Site URL pointing at another project (e.g. The-Scroll)

## Database migrations (order)

1. `20261109000000_init.sql`
2. Optional temporary: `20261109000001_anonymous_shelf.sql` (localhost only — **do not leave on public**)
3. **Required for public GHP:** `20261109000002_restore_auth_rls.sql`

## Safety script (not full VAPT)

```bash
npm run security:check
```

Runs audit (high+), lint, static build, scans `src/` for secrets / `dangerouslySetInnerHTML`, checks `.env.local` is untracked.

For deeper testing before a public launch: Supabase Security Advisor + optional OWASP ZAP against the GHP URL.

## Pre-deploy checklist

- [ ] `00002` RLS migration applied
- [ ] Google Auth + redirect URLs set for GHP
- [ ] GitHub Actions secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Repo variable `NEXT_PUBLIC_BASE_PATH` matches repo name
- [ ] `npm run security:check` locally
- [ ] Sign in with Google and create one entry on the live site
