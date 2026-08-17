# 🏠 Roofmates

Shared house, sorted. Split expenses fairly and keep one shared grocery board
with your housemates — no accounts, just a household code.

Built with **Next.js (App Router)**, **Supabase (Postgres)**, and **Tailwind CSS**.

## Features

- **Split expenses** — log rent, utilities, and shared buys; pick who paid and
  who to split between. Roofmates nets everything into the fewest
  "who owes whom" payments, and one tap **settles up** (only for payments you're
  part of).
- **Grocery board** — one shared list anyone can add to and check off at the store.
- **Chore rotation** — define a chore that rotates through chosen housemates on a
  cadence (daily / weekly / biweekly); see whose turn it is and what's next.
  **Vacation mode** drops a housemate out of every rotation while they're away.
- **No logins** — create a household, share the `ROOF-XXXX` code or invite link,
  and each person just picks their name.

## Local setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in with GitHub → **New project**.
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and **Run**.
3. Open **Project Settings → API** and copy:
   - **Project URL**
   - **service_role** secret key (under "Project API keys")

### 2. Configure env vars

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New Project**
   → import `roofmates`.
3. Under **Environment Variables**, add the same two variables from `.env.local`.
4. **Deploy.** You'll get a live `https://<project>.vercel.app` link.

## Architecture notes

- All database access flows through Next.js **API route handlers**
  (`src/app/api/**`) using the Supabase **service role key**, which stays on the
  server. The browser never talks to Supabase directly.
- Row Level Security is enabled with no policies, so the public anon key can't
  touch the tables — access is gated by knowing the household code.
- Balances and settle-up suggestions are computed in
  [`src/lib/finance.ts`](./src/lib/finance.ts) (exact, in integer cents).

## Roadmap

- Chore reminders (push/email/SMS to whoever's up this week + overdue nudges)
- Vacation-aware bill splitting (auto-exclude away housemates from utilities)
- Real accounts + multiple households per person
- Recurring expenses and receipt photos
