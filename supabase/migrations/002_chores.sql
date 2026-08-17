-- Adds chore rotation + vacation mode.
-- Run once in the Supabase SQL editor if your project predates this feature.

-- Vacation mode: a member on vacation drops out of every chore rotation.
alter table members
  add column if not exists on_vacation boolean not null default false;

-- A chore rotates among an ordered set of housemates on a fixed cadence.
-- participant_ids preserves rotation order; start_date anchors the schedule.
create table if not exists chores (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  name            text not null,
  cadence_days    int not null default 7 check (cadence_days > 0),
  participant_ids uuid[] not null default '{}',
  start_date      date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists chores_household_idx on chores(household_id);

alter table chores enable row level security;
