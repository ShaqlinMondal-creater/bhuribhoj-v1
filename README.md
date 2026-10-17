# BhuriBhoj Frontend

Next.js App Router frontend for the BhuriBhoj Laravel API.

## Views (3 areas)

| Area | Path | Who |
|------|------|-----|
| **Public** | `/`, `/login`, `/plans` | Anyone |
| **Mess** | `/mess/*` | president, manager, member |
| **Admin** | `/admin/*` | platform admin |

## Folder structure

```
src/
  app/
    (public)/          public marketing + login + plans
    (mess)/mess/       mess workspace
    (admin)/admin/     platform admin
    actions/           server actions (auth)
  components/
    auth/              LoginForm
    layout/            PublicHeader, MessShell, AdminShell
    motion/            FadeIn / Stagger
  lib/
    api/               Laravel server client
    auth/              cookies + roles
    config.ts          env-aware config
  proxy.ts             route protection (Next 16)
  types/
```

## Local vs live

`.env.local` / hosting env:

```env
NEXT_PUBLIC_APP_NAME=BhuriBhoj
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=/backend
LARAVEL_API_ORIGIN=http://127.0.0.1:8000
```

Production example:

```env
NEXT_PUBLIC_APP_URL=https://your-frontend.com
LARAVEL_API_ORIGIN=https://bhuribhoj-api.liwaas.com
```

- Server components call Laravel directly via `LARAVEL_API_ORIGIN` (no CORS).
- Optional browser proxy: `/backend/*` → Laravel `/api/*` (see `next.config.ts`).

## Run

```bash
# API
cd ../bhuribhoj-api
php artisan serve --host=127.0.0.1 --port=8000

# Frontend
npm run dev
```

Demo logins:
- `admin@bhuribhoj.local` / `Admin@123` → `/admin`
- `president@paulmess.local` / `President@123` → `/mess`
