export type Member = {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
};

export type Household = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  member_id: string;
  share: number;
};

export type Expense = {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  is_settlement: boolean;
  created_at: string;
  splits: ExpenseSplit[];
};

// A recorded payment between two members (an expense with is_settlement=true).
export type Payment = {
  id: string;
  amount: number;
  from: string; // payer (debtor)
  to: string; // recipient (creditor)
  created_at: string;
};

export type Grocery = {
  id: string;
  household_id: string;
  name: string;
  added_by: string;
  bought: boolean;
  bought_by: string | null;
  bought_at: string | null;
  created_at: string;
};

// A simplified "who owes whom" transfer.
export type Settlement = {
  from: string; // member id (debtor)
  to: string; // member id (creditor)
  amount: number;
};

export type HouseholdData = {
  household: Household;
  members: Member[];
  expenses: Expense[]; // real expenses only (is_settlement = false)
  payments: Payment[]; // recorded settle-up payments
  groceries: Grocery[];
  balances: Record<string, number>; // member id -> net balance (positive = owed money)
  settlements: Settlement[]; // suggested transfers to reach zero
};
