"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { HouseholdData } from "@/lib/types";
import { api, getIdentity, setIdentity, type Identity } from "@/lib/client";
import IdentityGate from "@/components/IdentityGate";
import ExpensesPanel from "@/components/ExpensesPanel";
import GroceriesPanel from "@/components/GroceriesPanel";
import ShareBar from "@/components/ShareBar";

type Tab = "expenses" | "groceries";

export default function Dashboard({ code }: { code: string }) {
  const [data, setData] = useState<HouseholdData | null>(null);
  const [identity, setIdent] = useState<Identity | null>(null);
  const [tab, setTab] = useState<Tab>("expenses");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const fresh = await api.load(code);
    setData(fresh);
    return fresh;
  }, [code]);

  useEffect(() => {
    setIdent(getIdentity(code));
    api
      .load(code)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setReady(true));
  }, [code]);

  if (!ready) {
    return <CenteredNote>Loading household…</CenteredNote>;
  }

  if (error || !data) {
    return (
      <CenteredNote>
        <p className="text-danger font-medium">
          {error ?? "Household not found."}
        </p>
        <Link href="/" className="btn-ghost mt-4">
          ← Back home
        </Link>
      </CenteredNote>
    );
  }

  // Identity gate: pick or add your name before using the household.
  const knownMember =
    identity && data.members.some((m) => m.id === identity.memberId);
  if (!identity || !knownMember) {
    return (
      <IdentityGate
        data={data}
        onPicked={(id) => {
          setIdentity(id);
          setIdent(id);
        }}
        onAdded={async (id) => {
          setIdentity(id);
          setIdent(id);
          await refresh();
        }}
      />
    );
  }

  const me = data.members.find((m) => m.id === identity.memberId)!;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-5 py-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-brand font-semibold text-sm"
            >
              <span>🏠</span> Roofmates
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {data.household.name}
            </h1>
          </div>
          <MemberBadge name={me.name} />
        </header>

        <ShareBar code={data.household.code} />

        <nav className="mt-6 flex gap-1 rounded-xl border bg-card p-1 text-sm font-medium">
          <TabBtn active={tab === "expenses"} onClick={() => setTab("expenses")}>
            💸 Expenses
          </TabBtn>
          <TabBtn
            active={tab === "groceries"}
            onClick={() => setTab("groceries")}
          >
            🛒 Groceries
          </TabBtn>
        </nav>

        <div className="mt-5">
          {tab === "expenses" ? (
            <ExpensesPanel
              data={data}
              me={me}
              code={code}
              onChange={refresh}
            />
          ) : (
            <GroceriesPanel
              data={data}
              me={me}
              code={code}
              onChange={refresh}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 grid place-items-center px-5">
      <div className="text-center text-muted">{children}</div>
    </main>
  );
}

function MemberBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white text-xs font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="font-medium">{name}</span>
    </div>
  );
}

function TabBtn({
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
      className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
        active ? "bg-brand text-white" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
