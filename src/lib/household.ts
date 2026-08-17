import { getServiceClient } from "./supabase";
import { computeBalances, computeSettlements } from "./finance";
import type { Household, HouseholdData } from "./types";

// Resolve a household row by its join code (case-insensitive). Null if missing.
export async function getHouseholdByCode(
  rawCode: string
): Promise<Household | null> {
  const code = rawCode.trim().toUpperCase();
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("households")
    .select()
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Load the full household snapshot by join code. Returns null if not found.
export async function loadHousehold(
  rawCode: string
): Promise<HouseholdData | null> {
  const code = rawCode.trim().toUpperCase();
  const supabase = getServiceClient();

  const { data: household, error } = await supabase
    .from("households")
    .select()
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!household) return null;

  const [membersRes, expensesRes, splitsRes, groceriesRes] = await Promise.all([
    supabase
      .from("members")
      .select()
      .eq("household_id", household.id)
      .order("created_at"),
    supabase
      .from("expenses")
      .select()
      .eq("household_id", household.id)
      .order("created_at", { ascending: false }),
    supabase.from("expense_splits").select(),
    supabase
      .from("groceries")
      .select()
      .eq("household_id", household.id)
      .order("created_at", { ascending: false }),
  ]);

  for (const r of [membersRes, expensesRes, splitsRes, groceriesRes]) {
    if (r.error) throw r.error;
  }

  const expenseIds = new Set((expensesRes.data ?? []).map((e) => e.id));
  const splitsByExpense = new Map<string, typeof splitsRes.data>();
  for (const s of splitsRes.data ?? []) {
    if (!expenseIds.has(s.expense_id)) continue;
    const arr = splitsByExpense.get(s.expense_id) ?? [];
    arr.push(s);
    splitsByExpense.set(s.expense_id, arr);
  }

  const expenses = (expensesRes.data ?? []).map((e) => ({
    ...e,
    amount: Number(e.amount),
    splits: (splitsByExpense.get(e.id) ?? []).map((s) => ({
      ...s,
      share: Number(s.share),
    })),
  }));

  const balances = computeBalances(expenses);
  // Ensure every member appears in balances (even at 0).
  for (const m of membersRes.data ?? []) {
    if (!(m.id in balances)) balances[m.id] = 0;
  }
  const settlements = computeSettlements(balances);

  return {
    household,
    members: membersRes.data ?? [],
    expenses,
    groceries: groceriesRes.data ?? [],
    balances,
    settlements,
  };
}
