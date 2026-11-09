# Media Critic

Personal anime, movie, and manga tracker (ratings + reviews) for a **single Google-signed-in user**, deployable to **GitHub Pages**.

## Stack

- Next.js static export (`output: 'export'`)
- Supabase Auth (Google) + Postgres RLS
- Zod validation in the browser
- Tailwind + shadcn/ui

## Why Google auth (even if “only me”)

On a public GitHub Pages URL, **no auth + open RLS is unsafe**. Google sign-in + `user_id = auth.uid()` keeps strangers from editing your shelf. SQL injection risk stays low via the Supabase client + Zod (see [`SECURITY.md`](SECURITY.md)).

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
2. [`supabase/migrations/20261109000002_restore_auth_rls.sql`](supabase/migrations/20261109000002_restore_auth_rls.sql) — **required** for Google auth (replaces anonymous open policies)

If you previously ran `00001_anonymous_shelf.sql`, still run `00002` before public deploy.

### Auth redirects (local)

1. **Enable Google** in [Auth → Providers](https://supabase.com/dashboard/project/kaiffjdbfjkjqisumklh/auth/providers)  
   (if you see `Unsupported provider: provider is not enabled`, this step was skipped).
2. Create a Google Cloud **Web** OAuth client; set **Authorized redirect URI** to  
   `https://kaiffjdbfjkjqisumklh.supabase.co/auth/v1/callback`  
   Paste Client ID + Secret into Supabase Google provider → **Save**.  
   If consent screen is **Testing**, add yourself as a test user.
3. In [Auth → URL configuration](https://supabase.com/dashboard/project/kaiffjdbfjkjqisumklh/auth/url-configuration):
   - Site URL: `http://localhost:3000`
   - Redirect: `http://localhost:3000/auth/callback/`

```bash
npm run dev
```

Open **http://localhost:3000** (prefer `localhost` over `127.0.0.1`) → Continue with Google.

## GitHub Pages deploy

1. Set repo name → `NEXT_PUBLIC_BASE_PATH` (e.g. `/MEDIA-CRITIC`).
2. GitHub → Settings → Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. GitHub → Variables: `NEXT_PUBLIC_BASE_PATH=/Your-Repo-Name`.
4. Enable Pages: source **GitHub Actions**.
5. Push to `main` / `master` — workflow [`.github/workflows/deploy-ghp.yml`](.github/workflows/deploy-ghp.yml) builds `out/` and deploys.
6. Supabase Auth Site URL / redirects for  
   `https://<user>.github.io/<repo>/` and  
   `https://<user>.github.io/<repo>/auth/callback/`

Local GHP build:

```bash
NEXT_PUBLIC_BASE_PATH=/MEDIA-CRITIC npm run build:ghp
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

- `/login/` — Google sign-in
- `/dashboard/` — home + recent
- `/library/` — filter / search
- `/add/` — create
- `/entries/view/?id=` — detail
- `/entries/edit/?id=` — edit
