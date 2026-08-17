import type { Expense, Settlement } from "./types";

// Split an amount equally across n members, in whole cents, so the shares sum
// exactly to the amount. Any leftover cent(s) are distributed to the first
// members (deterministic).
export function equalShares(amount: number, n: number): number[] {
  const totalCents = Math.round(amount * 100);
  const base = Math.floor(totalCents / n);
  let remainder = totalCents - base * n;
  const shares: number[] = [];
  for (let i = 0; i < n; i++) {
    const cents = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    shares.push(cents / 100);
  }
  return shares;
}

// Net balance per member: positive means the household owes them money
// (they paid more than their share), negative means they owe.
export function computeBalances(expenses: Expense[]): Record<string, number> {
  const cents: Record<string, number> = {};
  const add = (id: string, c: number) => {
    cents[id] = (cents[id] ?? 0) + c;
  };
  for (const e of expenses) {
    add(e.paid_by, Math.round(e.amount * 100));
    for (const s of e.splits) {
      add(s.member_id, -Math.round(s.share * 100));
    }
  }
  const balances: Record<string, number> = {};
  for (const [id, c] of Object.entries(cents)) balances[id] = c / 100;
  return balances;
}

// Greedy debt simplification: match biggest debtor with biggest creditor.
export function computeSettlements(
  balances: Record<string, number>
): Settlement[] {
  const debtors: { id: string; cents: number }[] = [];
  const creditors: { id: string; cents: number }[] = [];
  for (const [id, bal] of Object.entries(balances)) {
    const c = Math.round(bal * 100);
    if (c < 0) debtors.push({ id, cents: -c });
    else if (c > 0) creditors.push({ id, cents: c });
  }
  debtors.sort((a, b) => b.cents - a.cents);
  creditors.sort((a, b) => b.cents - a.cents);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].cents, creditors[j].cents);
    if (pay > 0) {
      settlements.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: pay / 100,
      });
    }
    debtors[i].cents -= pay;
    creditors[j].cents -= pay;
    if (debtors[i].cents === 0) i++;
    if (creditors[j].cents === 0) j++;
  }
  return settlements;
}

// Human-friendly household join code, e.g. ROOF-7Q2K.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
export function generateCode(): string {
  let s = "";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 4; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `ROOF-${s}`;
}
