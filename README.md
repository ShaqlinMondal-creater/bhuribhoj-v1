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
    page.tsx           home page at /
    about/ contact/ features/ plans/ login/ register/
    admin/             platform admin at /admin
    mess/              mess workspace at /mess
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

## API target

Local and Vercel both use the **live** API via the `/backend` proxy (avoids CORS on localhost):

```env
NEXT_PUBLIC_API_BASE=/backend
LARAVEL_API_ORIGIN=https://bhuribhoj-api.liwaas.com
```

Browser → `/backend/...` → Next rewrite → `https://bhuribhoj-api.liwaas.com/api/...`

## Run

```bash
# Frontend (talks to live API)
npm run dev
```

API changes: pull/deploy on the live `bhuribhoj-api.liwaas.com` server.

Demo logins:
- `admin@bhuribhoj.local` / `Admin@123` → `/admin`
- `president@paulmess.local` / `President@123` → `/mess`
