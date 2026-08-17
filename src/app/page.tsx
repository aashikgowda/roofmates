"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setIdentity } from "@/lib/client";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
        <div className="flex items-center gap-2 text-brand font-semibold">
          <span className="text-2xl">🏠</span>
          <span className="tracking-tight text-lg">Roofmates</span>
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Shared house, sorted.
        </h1>
        <p className="mt-3 text-muted text-lg leading-relaxed">
          Split expenses fairly and keep one shared grocery board — for everyone
          under your roof. No accounts, no passwords. Just a household code you
          share with your roommates.
        </p>

        <div className="mt-10 rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="flex border-b">
            <TabButton
              active={mode === "create"}
              onClick={() => setMode("create")}
            >
              Start a household
            </TabButton>
            <TabButton active={mode === "join"} onClick={() => setMode("join")}>
              Join with a code
            </TabButton>
          </div>
          <div className="p-6">
            {mode === "create" ? (
              <CreateForm onDone={(code) => router.push(`/h/${code}`)} />
            ) : (
              <JoinForm onDone={(code) => router.push(`/h/${code}`)} />
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Feature emoji="💸" title="Split expenses">
            Log rent, utilities and shared buys. Roofmates nets everything out
            into the fewest “who owes whom” payments.
          </Feature>
          <Feature emoji="🛒" title="Grocery board">
            One shared list. Anyone adds what the house needs; whoever’s at the
            store checks it off.
          </Feature>
        </div>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-card text-brand"
          : "bg-background/50 text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CreateForm({ onDone }: { onDone: (code: string) => void }) {
  const [householdName, setHouseholdName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { household, member } = await api.createHousehold(
        householdName,
        memberName
      );
      setIdentity({
        code: household.code,
        memberId: member.id,
        name: member.name,
      });
      onDone(household.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Household name">
        <input
          className="input"
          placeholder="e.g. 12 Maple St"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          required
        />
      </Field>
      <Field label="Your name">
        <input
          className="input"
          placeholder="e.g. Aashik"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          required
        />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Creating…" : "Create household"}
      </button>
    </form>
  );
}

function JoinForm({ onDone }: { onDone: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.join(code);
      onDone(data.household.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Household code">
        <input
          className="input uppercase tracking-widest font-mono"
          placeholder="ROOF-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Finding…" : "Find household"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Feature({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted leading-relaxed">{children}</p>
    </div>
  );
}
