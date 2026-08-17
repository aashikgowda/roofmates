"use client";

import { useMemo, useState } from "react";
import type { HouseholdData, Member } from "@/lib/types";
import { api, money } from "@/lib/client";

export default function ExpensesPanel({
  data,
  me,
  code,
  onChange,
}: {
  data: HouseholdData;
  me: Member;
  code: string;
  onChange: () => Promise<HouseholdData>;
}) {
  const nameOf = useMemo(() => {
    const map = new Map(data.members.map((m) => [m.id, m.name]));
    return (id: string) => map.get(id) ?? "Someone";
  }, [data.members]);

  const myBalance = data.balances[me.id] ?? 0;

  return (
    <div className="space-y-5">
      <BalanceCard
        myBalance={myBalance}
        settlements={data.settlements}
        meId={me.id}
        nameOf={nameOf}
      />

      <AddExpenseForm
        data={data}
        me={me}
        code={code}
        onChange={onChange}
      />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          History
        </h2>
        {data.expenses.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No expenses yet. Add the first one above.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{e.description}</p>
                  <p className="text-sm text-muted">
                    {nameOf(e.paid_by)} paid · split {e.splits.length} way
                    {e.splits.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">
                  {money(e.amount)}
                </span>
                <button
                  onClick={async () => {
                    await api.deleteExpense(code, e.id);
                    await onChange();
                  }}
                  className="text-muted hover:text-danger text-sm"
                  title="Delete"
                  aria-label="Delete expense"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BalanceCard({
  myBalance,
  settlements,
  meId,
  nameOf,
}: {
  myBalance: number;
  settlements: HouseholdData["settlements"];
  meId: string;
  nameOf: (id: string) => string;
}) {
  const rounded = Math.round(myBalance * 100) / 100;
  const status =
    rounded > 0 ? "owed" : rounded < 0 ? "owe" : "even";

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted">Your balance</p>
      <p
        className={`mt-1 text-3xl font-bold tabular-nums ${
          status === "owed"
            ? "text-accent"
            : status === "owe"
              ? "text-danger"
              : "text-foreground"
        }`}
      >
        {money(Math.abs(rounded))}
      </p>
      <p className="text-sm text-muted">
        {status === "owed"
          ? "you're owed overall"
          : status === "owe"
            ? "you owe overall"
            : "you're all settled up"}
      </p>

      {settlements.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Suggested settle-up
          </p>
          <ul className="mt-2 space-y-1.5">
            {settlements.map((s, i) => {
              const involvesMe = s.from === meId || s.to === meId;
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between text-sm ${
                    involvesMe ? "font-medium" : "text-muted"
                  }`}
                >
                  <span>
                    {s.from === meId ? "You" : nameOf(s.from)}{" "}
                    <span className="text-muted">→</span>{" "}
                    {s.to === meId ? "you" : nameOf(s.to)}
                  </span>
                  <span className="tabular-nums">{money(s.amount)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function AddExpenseForm({
  data,
  me,
  code,
  onChange,
}: {
  data: HouseholdData;
  me: Member;
  code: string;
  onChange: () => Promise<HouseholdData>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(me.id);
  const [splitAmong, setSplitAmong] = useState<string[]>(
    data.members.map((m) => m.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSplitAmong((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.addExpense(code, {
        description,
        amount: Number(amount),
        paidBy,
        splitAmong,
      });
      setDescription("");
      setAmount("");
      setSplitAmong(data.members.map((m) => m.id));
      setPaidBy(me.id);
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border bg-card p-5 shadow-sm space-y-4"
    >
      <h2 className="font-semibold">Add an expense</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
        <input
          className="input"
          placeholder="What was it for? e.g. Electric bill"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          className="input"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Paid by</span>
        <select
          className="input"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id === me.id ? `${m.name} (you)` : m.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="block text-sm font-medium mb-1.5">Split between</span>
        <div className="flex flex-wrap gap-2">
          {data.members.map((m) => {
            const on = splitAmong.includes(m.id);
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-brand bg-brand text-white"
                    : "bg-card text-muted hover:text-foreground"
                }`}
              >
                {on ? "✓ " : ""}
                {m.id === me.id ? "You" : m.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Adding…" : "Add expense"}
      </button>
    </form>
  );
}
