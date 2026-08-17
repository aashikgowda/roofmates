-- Adds settle-up support. A settlement is stored as an expense where the payer
-- is the debtor and the single split is the creditor, so it reuses the existing
-- balance math. This flag lets the UI render payments separately from expenses.
-- Run once in the Supabase SQL editor if your project predates this feature.

alter table expenses
  add column if not exists is_settlement boolean not null default false;
