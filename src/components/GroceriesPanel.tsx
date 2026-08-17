"use client";

import { useMemo, useState } from "react";
import type { HouseholdData, Member } from "@/lib/types";
import { api } from "@/lib/client";

export default function GroceriesPanel({
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
    return (id: string | null) => (id ? map.get(id) ?? "Someone" : "Someone");
  }, [data.members]);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needed = data.groceries.filter((g) => !g.bought);
  const bought = data.groceries.filter((g) => g.bought);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await api.addGrocery(code, name, me.id);
      setName("");
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={add}
        className="flex gap-2 rounded-2xl border bg-card p-4 shadow-sm"
      >
        <input
          className="input"
          placeholder="Add an item… e.g. Milk"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary shrink-0" disabled={loading}>
          Add
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          To buy ({needed.length})
        </h2>
        {needed.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing on the list. The house is stocked 🎉
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {needed.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
              >
                <button
                  onClick={async () => {
                    await api.toggleGrocery(code, g.id, true, me.id);
                    await onChange();
                  }}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-border hover:border-accent"
                  aria-label="Mark bought"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted">
                    added by {g.added_by === me.id ? "you" : nameOf(g.added_by)}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await api.deleteGrocery(code, g.id);
                    await onChange();
                  }}
                  className="text-muted hover:text-danger text-sm"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {bought.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Bought ({bought.length})
          </h2>
          <ul className="mt-2 space-y-2">
            {bought.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3"
              >
                <button
                  onClick={async () => {
                    await api.toggleGrocery(code, g.id, false, null);
                    await onChange();
                  }}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent text-white"
                  aria-label="Mark not bought"
                >
                  ✓
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate line-through text-muted">
                    {g.name}
                  </p>
                  <p className="text-xs text-muted">
                    bought by{" "}
                    {g.bought_by === me.id ? "you" : nameOf(g.bought_by)}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await api.deleteGrocery(code, g.id);
                    await onChange();
                  }}
                  className="text-muted hover:text-danger text-sm"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
