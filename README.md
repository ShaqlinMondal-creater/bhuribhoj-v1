This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Data storage

All CRUD goes through one server-side repository (`src/lib/server/storage`). Nothing is stored in the browser — the only `localStorage` usage in the app is the demo login session in `src/auth/authService.ts`.

| Where the app runs | Backend | What is written |
| --- | --- | --- |
| Local, nothing configured | Filesystem | `src/data/json/<collection>.json` |
| A Blob store is connected | Vercel Blob (private) | `bhuribhoj/<collection>.json` |
| Running on Vercel | Vercel Blob (private) | `bhuribhoj/<collection>.json` |

`npm run dev` works with no setup at all: it reads and writes real files in `src/data/json`. The **Reset** action copies the immutable seeds in `src/data/initial` back over the live files.

### Vercel Blob setup

1. Create a **private** Blob store in the Vercel dashboard.
2. Connect it to this project for the **Production** and **Preview** environments.
3. Redeploy.

Connecting the store is all you need to do. It sets `BLOB_STORE_ID`, and Vercel hands the running function its own short-lived credential — there is no token for you to add to the environment. If you would rather use a long-lived token, set `BLOB_READ_WRITE_TOKEN` instead. Both are read on the server only and must **not** be prefixed with `NEXT_PUBLIC_`.

If the app is running on Vercel without a connected store, every request fails with a `500` that explains what to do. This is deliberate: there is no silent fallback to the filesystem, because a Vercel function's filesystem is read-only and discarded between invocations, so writing there would report success while losing every change.

To use Blob in local development, pull the project environment first:

```bash
vercel env pull .env.local
npm run dev
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BLOB_STORE_ID` | On Vercel | Identifies the connected Blob store. On its own this is enough to select Blob. |
| `BLOB_READ_WRITE_TOKEN` | Alternative | Long-lived Blob credential, used when no store is connected. |
| `BHURIBHOJ_STORAGE` | No | Force a backend: `filesystem` or `vercel-blob` (aliases `fs`, `local`, `vercel`). Useful for testing. An unrecognised value is rejected with an error. |

`BHURIBHOJ_STORAGE=filesystem` on Vercel will let you read and write the local JSON files, but the changes will not survive a redeploy. Use it for local debugging only.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# bhuribhoj-v1" 
