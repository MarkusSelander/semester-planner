This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database (Supabase + Prisma)

Runtime (`lib/prisma.ts`) reads `DATABASE_URL`. Prisma CLI/migrate (`prisma.config.ts`) reads `DIRECT_URL`, then falls back to `DATABASE_URL`.

| Env | Port | Used by |
| --- | --- | --- |
| `DATABASE_URL` | `6543` + `pgbouncer=true` | App / Vercel functions (transaction pooler) |
| `DIRECT_URL` | `5432` (session or direct) | `prisma migrate` |

Local Postgres can set both to `localhost:5432`. Copy `.env.example` for the full list.

**Check before changing production env**

- Current local `DATABASE_URL` already uses the Tokyo pooler (`aws-1-ap-northeast-1`, port `6543`).
- Current `DIRECT_URL` is a copy of that pooler URL (also `6543`). Replace it with the session/direct string on port `5432` before relying on migrate.
- `vercel.json` has no `regions`. Vercel functions default to `iad1` (Washington). The database is in `ap-northeast-1` (Tokyo / Vercel `hnd1`). Align function region with the database, or move the Supabase project closer to users (`fra1` / `eu-central-1` for Norway). Confirm the dashboard setting before changing env or `vercel.json`.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
