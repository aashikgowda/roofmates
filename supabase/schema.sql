-- Roofmates schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- All app access goes through Next.js API routes using the service role key,
-- which bypasses RLS. We enable RLS with no policies so the public anon key
-- cannot read/write these tables directly.

create extension if not exists "pgcrypto";

create table if not exists households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  -- A member on vacation drops out of every chore rotation.
  on_vacation  boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  description   text not null,
  amount        numeric(12,2) not null check (amount > 0),
  paid_by       uuid not null references members(id) on delete cascade,
  -- A settlement is a payment from a debtor to a creditor, stored as an expense
  -- (payer = debtor, single split = creditor) so it reuses the balance math.
  is_settlement boolean not null default false,
  created_at    timestamptz not null default now()
);

-- One row per member who shares an expense (equal split among these members).
create table if not exists expense_splits (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  share      numeric(12,2) not null
);

create table if not exists groceries (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  added_by     uuid not null references members(id) on delete cascade,
  bought       boolean not null default false,
  bought_by    uuid references members(id) on delete set null,
  bought_at    timestamptz,
  created_at   timestamptz not null default now()
);

-- A chore rotates among an ordered set of housemates on a fixed cadence.
create table if not exists chores (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  name            text not null,
  cadence_days    int not null default 7 check (cadence_days > 0),
  participant_ids uuid[] not null default '{}',
  start_date      date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists members_household_idx    on members(household_id);
create index if not exists expenses_household_idx    on expenses(household_id);
create index if not exists expense_splits_expense_idx on expense_splits(expense_id);
create index if not exists groceries_household_idx   on groceries(household_id);
create index if not exists chores_household_idx      on chores(household_id);

alter table households     enable row level security;
alter table members        enable row level security;
alter table expenses       enable row level security;
alter table expense_splits enable row level security;
alter table groceries      enable row level security;
alter table chores         enable row level security;
