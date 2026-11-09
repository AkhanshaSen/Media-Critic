# Media Critic

Anime, movie, and manga tracker (ratings + reviews) with **open Google or email sign-in**. Each authenticated user has a private shelf (RLS). Deployable to **GitHub Pages**.

## Stack

- Next.js static export (`output: 'export'`)
- Supabase Auth (**Google** + **email magic link**) + Postgres RLS
- Zod validation in the browser
- Tailwind + shadcn/ui

## Why auth on a public URL

On a public GitHub Pages URL, **no auth + open RLS is unsafe**. Sign-in + `user_id = auth.uid()` keeps each person’s reviews private from other accounts. SQL injection risk stays low via the Supabase client + Zod (see [`SECURITY.md`](SECURITY.md)).

## Local setup

```bash
npm install
cp .env.example .env.local
```

`.env.local` (leave `NEXT_PUBLIC_BASE_PATH` empty for local):

```
NEXT_PUBLIC_SUPABASE_URL=https://kaiffjdbfjkjqisumklh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_BASE_PATH=
```

### SQL (in order)

1. [`supabase/migrations/20261109000000_init.sql`](supabase/migrations/20261109000000_init.sql)
2. [`supabase/migrations/20261109000002_restore_auth_rls.sql`](supabase/migrations/20261109000002_restore_auth_rls.sql) — **required** (owner RLS; replaces anonymous open policies)
3. [`supabase/migrations/20261109000003_ensure_user_profile.sql`](supabase/migrations/20261109000003_ensure_user_profile.sql) — **required** (backfill `public.users` / `user_settings`, `ensure_user_profile` RPC)
4. [`supabase/migrations/20261109000004_progress_format.sql`](supabase/migrations/20261109000004_progress_format.sql) — progress unit, digital/physical format, volume fields
5. [`supabase/migrations/20261109000005_image_roles.sql`](supabase/migrations/20261109000005_image_roles.sql) — poster / backdrop / still roles + `backdrop_image_id`
6. [`supabase/migrations/20261109000006_page_template.sql`](supabase/migrations/20261109000006_page_template.sql) — cinematic / magazine / minimal page looks

If you previously ran `00001_anonymous_shelf.sql`, still run `00002` then `00003` (and later migrations) before public deploy.

Profiles are created by a trigger on **new** `auth.users` rows and by the app calling `ensure_user_profile` after sign-in. If Auth shows a user but Table Editor → `public.users` does not, run migration `00003`.

### Auth (local)

1. Enable **Google** and **Email** in [Auth → Providers](https://supabase.com/dashboard/project/kaiffjdbfjkjqisumklh/auth/providers).
2. Google Cloud **Web** OAuth client → Authorized redirect URI  
   `https://kaiffjdbfjkjqisumklh.supabase.co/auth/v1/callback`  
   Paste Client ID + Secret into Supabase Google provider → **Save**.
3. In [Auth → URL configuration](https://supabase.com/dashboard/project/kaiffjdbfjkjqisumklh/auth/url-configuration):
   - Site URL: `http://localhost:3000`
   - Redirects: `http://localhost:3000/auth/callback/` (and `/**` variants as needed)

```bash
npm run dev
```

Open **http://localhost:3000** (prefer `localhost` over `127.0.0.1`) → Google or magic link.

Optional demo shelf (CC0/Wikimedia covers + DiceBear avatar) for your existing signed-in user:

```bash
npm run seed:sample
```

Requires the Supabase CLI signed in on this Mac (or `SUPABASE_ACCESS_TOKEN`). Re-runs replace entries tagged `sample-seed`.

## GitHub Pages deploy

1. Set repo name → `NEXT_PUBLIC_BASE_PATH` (e.g. `/Media-Critic`).
2. GitHub → Settings → Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. GitHub → Variables: `NEXT_PUBLIC_BASE_PATH=/Your-Repo-Name`.
4. Enable Pages: source **GitHub Actions** (not “Deploy from a branch”).
5. Push to `main` / `master` — workflow [`.github/workflows/deploy-ghp.yml`](.github/workflows/deploy-ghp.yml) builds `out/` and deploys.
6. Supabase Auth Site URL / redirects for  
   `https://<user>.github.io/<repo>/` and  
   `https://<user>.github.io/<repo>/auth/callback/`

After a deploy, **hard-refresh** (Cmd+Shift+R) or open an incognito window. If you still see this README rendered as the site, confirm Settings → Pages → Source is **GitHub Actions**, that the latest **Deploy GitHub Pages** run succeeded, and wait a few minutes for CDN cache (`max-age=600`).

Local GHP build:

```bash
NEXT_PUBLIC_BASE_PATH=/Media-Critic npm run build:ghp
```

## Safety check

```bash
npm run security:check
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local app (no base path) |
| `npm run build:ghp` | Static export to `out/` |
| `npm run security:check` | Audit, lint, build, secret scan |
| `npm run lint` | ESLint |

## App routes

- `/login/` — Google + email magic link
- `/dashboard/` — home + recent
- `/library/` — filter / search
- `/add/` — create
- `/entries/view/?id=` — detail
- `/entries/edit/?id=` — edit
