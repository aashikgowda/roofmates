"use client";

import { useState } from "react";
import type { HouseholdData } from "@/lib/types";
import { api, type Identity } from "@/lib/client";

// Shown when the visitor has no saved identity for this household. They either
// claim an existing name or add themselves as a new member.
export default function IdentityGate({
  data,
  onPicked,
  onAdded,
}: {
  data: HouseholdData;
  onPicked: (id: Identity) => void;
  onAdded: (id: Identity) => void;
}) {
  const code = data.household.code;
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addMe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { member } = await api.addMember(code, name);
      onAdded({ code, memberId: member.id, name: member.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add you.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 grid place-items-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand font-semibold">
          <span>🏠</span> {data.household.name}
        </div>
        <h1 className="mt-3 text-xl font-bold">Who are you?</h1>
        <p className="mt-1 text-sm text-muted">
          Pick your name so we know whose expenses and groceries are whose.
        </p>

        {data.members.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              I&apos;m already in this household
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    onPicked({ code, memberId: m.id, name: m.name })
                  }
                  className="btn-ghost"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={addMe} className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            I&apos;m new here
          </p>
          <div className="mt-2 flex gap-2">
            <input
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button className="btn-primary shrink-0" disabled={loading}>
              {loading ? "Adding…" : "Join"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </form>
      </div>
    </main>
  );
}
