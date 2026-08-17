"use client";

import { useMemo, useState } from "react";
import type { Chore, HouseholdData, Member } from "@/lib/types";
import { api, shortDate } from "@/lib/client";
import { CADENCES, cadenceLabel, choreSchedule } from "@/lib/chores";

export default function ChoresPanel({
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

  const onVacation = useMemo(
    () => new Set(data.members.filter((m) => m.on_vacation).map((m) => m.id)),
    [data.members]
  );

  return (
    <div className="space-y-5">
      <VacationCard data={data} me={me} code={code} onChange={onChange} />
      <AddChoreForm data={data} code={code} onChange={onChange} />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Chores
        </h2>
        {data.chores.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No chores yet. Add one above to start a rotation.
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {data.chores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onVacation={onVacation}
                nameOf={nameOf}
                meId={me.id}
                code={code}
                onChange={onChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function VacationCard({
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
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(m: Member) {
    setBusy(m.id);
    try {
      await api.setVacation(code, m.id, !m.on_vacation);
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Who&apos;s around</h2>
      <p className="mt-1 text-sm text-muted">
        Turn on vacation mode to drop out of every chore rotation while
        you&apos;re away.
      </p>
      <ul className="mt-3 space-y-1.5">
        {data.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 py-1"
          >
            <span className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  m.on_vacation
                    ? "bg-border text-muted"
                    : "bg-brand text-white"
                }`}
              >
                {m.name.charAt(0).toUpperCase()}
              </span>
              <span className={m.on_vacation ? "text-muted" : ""}>
                {m.id === me.id ? `${m.name} (you)` : m.name}
                {m.on_vacation && (
                  <span className="ml-2 text-xs">🏝️ on vacation</span>
                )}
              </span>
            </span>
            <button
              onClick={() => toggle(m)}
              disabled={busy !== null}
              role="switch"
              aria-checked={m.on_vacation}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                m.on_vacation ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  m.on_vacation ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddChoreForm({
  data,
  code,
  onChange,
}: {
  data: HouseholdData;
  code: string;
  onChange: () => Promise<HouseholdData>;
}) {
  const [name, setName] = useState("");
  const [cadenceDays, setCadenceDays] = useState(7);
  const [participants, setParticipants] = useState<string[]>(
    data.members.map((m) => m.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.addChore(code, {
        name,
        cadenceDays,
        participantIds: participants,
      });
      setName("");
      setCadenceDays(7);
      setParticipants(data.members.map((m) => m.id));
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add chore.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border bg-card p-5 shadow-sm space-y-4"
    >
      <h2 className="font-semibold">Add a chore</h2>
      <input
        className="input"
        placeholder="What needs doing? e.g. Take out the trash"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Repeats</span>
        <select
          className="input"
          value={cadenceDays}
          onChange={(e) => setCadenceDays(Number(e.target.value))}
        >
          {CADENCES.map((c) => (
            <option key={c.days} value={c.days}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="block text-sm font-medium mb-1.5">
          Rotate between
        </span>
        <div className="flex flex-wrap gap-2">
          {data.members.map((m) => {
            const on = participants.includes(m.id);
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
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Adding…" : "Add chore"}
      </button>
    </form>
  );
}

function ChoreCard({
  chore,
  onVacation,
  nameOf,
  meId,
  code,
  onChange,
}: {
  chore: Chore;
  onVacation: Set<string>;
  nameOf: (id: string) => string;
  meId: string;
  code: string;
  onChange: () => Promise<HouseholdData>;
}) {
  const schedule = useMemo(
    () => choreSchedule(chore, onVacation, new Date()),
    [chore, onVacation]
  );
  const current = schedule.currentAssigneeId;
  const isMine = current === meId;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{chore.name}</h3>
          <p className="text-xs text-muted">
            {cadenceLabel(chore.cadence_days)} · rotates through{" "}
            {chore.participant_ids.map((id) => nameOf(id)).join(", ")}
          </p>
        </div>
        <button
          onClick={async () => {
            await api.deleteChore(code, chore.id);
            await onChange();
          }}
          className="text-muted hover:text-danger text-sm"
          aria-label="Delete chore"
        >
          ✕
        </button>
      </div>

      <div
        className={`mt-4 rounded-xl px-4 py-3 ${
          isMine ? "bg-brand/10" : "bg-background"
        }`}
      >
        {current ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Whose turn
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {isMine ? "Your turn 🧹" : nameOf(current)}
            </p>
            <p className="text-sm text-muted">
              until {shortDate(schedule.currentPeriodEnd)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Everyone in this rotation is on vacation.
          </p>
        )}
      </div>

      {schedule.upcoming.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Coming up
          </p>
          <ul className="mt-1.5 space-y-1">
            {schedule.upcoming.map((t, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className={t.assigneeId === meId ? "font-medium" : ""}>
                  {t.assigneeId === meId ? "You" : nameOf(t.assigneeId)}
                </span>
                <span className="text-muted">{shortDate(t.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
