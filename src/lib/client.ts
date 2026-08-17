"use client";

import type { HouseholdData } from "./types";

// The current user's identity within a household, persisted in localStorage.
export type Identity = { code: string; memberId: string; name: string };

const key = (code: string) => `roofmates:identity:${code.toUpperCase()}`;

export function getIdentity(code: string): Identity | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(code));
  return raw ? (JSON.parse(raw) as Identity) : null;
}

export function setIdentity(id: Identity) {
  window.localStorage.setItem(key(id.code), JSON.stringify(id));
}

export function clearIdentity(code: string) {
  window.localStorage.removeItem(key(code));
}

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export const api = {
  createHousehold: (householdName: string, memberName: string) =>
    fetch("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdName, memberName }),
    }).then(jsonOrThrow),

  join: (code: string): Promise<HouseholdData> =>
    fetch("/api/households/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then(jsonOrThrow),

  load: (code: string): Promise<HouseholdData> =>
    fetch(`/api/households/${code}`, { cache: "no-store" }).then(jsonOrThrow),

  addMember: (code: string, name: string) =>
    fetch(`/api/households/${code}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(jsonOrThrow),

  addExpense: (
    code: string,
    body: {
      description: string;
      amount: number;
      paidBy: string;
      splitAmong: string[];
    }
  ) =>
    fetch(`/api/households/${code}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(jsonOrThrow),

  deleteExpense: (code: string, id: string) =>
    fetch(`/api/households/${code}/expenses/${id}`, {
      method: "DELETE",
    }).then(jsonOrThrow),

  addGrocery: (code: string, name: string, addedBy: string) =>
    fetch(`/api/households/${code}/groceries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, addedBy }),
    }).then(jsonOrThrow),

  toggleGrocery: (
    code: string,
    id: string,
    bought: boolean,
    boughtBy: string | null
  ) =>
    fetch(`/api/households/${code}/groceries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bought, boughtBy }),
    }).then(jsonOrThrow),

  deleteGrocery: (code: string, id: string) =>
    fetch(`/api/households/${code}/groceries/${id}`, {
      method: "DELETE",
    }).then(jsonOrThrow),
};

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
