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
  created_at   timestamptz not null default now()
);

create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  description  text not null,
  amount       numeric(12,2) not null check (amount > 0),
  paid_by      uuid not null references members(id) on delete cascade,
  created_at   timestamptz not null default now()
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

create index if not exists members_household_idx    on members(household_id);
create index if not exists expenses_household_idx    on expenses(household_id);
create index if not exists expense_splits_expense_idx on expense_splits(expense_id);
create index if not exists groceries_household_idx   on groceries(household_id);

alter table households     enable row level security;
alter table members        enable row level security;
alter table expenses       enable row level security;
alter table expense_splits enable row level security;
alter table groceries      enable row level security;
