import type { Chore } from "./types";

export const CADENCES: { label: string; days: number }[] = [
  { label: "Daily", days: 1 },
  { label: "Weekly", days: 7 },
  { label: "Every 2 weeks", days: 14 },
];

export function cadenceLabel(days: number): string {
  return CADENCES.find((c) => c.days === days)?.label ?? `Every ${days} days`;
}

// Parse a YYYY-MM-DD string to a UTC-midnight epoch (date-only, DST-safe).
function dateToUTC(d: string): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

// A Date's local calendar day as a UTC-midnight epoch, so comparisons are
// purely date-based regardless of time zone.
function localDayUTC(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

const DAY_MS = 86_400_000;

function utcToISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export type ChoreTurn = { assigneeId: string; date: string };

export type ChoreSchedule = {
  currentAssigneeId: string | null; // null if everyone in the chore is away
  currentPeriodStart: string;
  currentPeriodEnd: string; // exclusive; the next turn starts here
  upcoming: ChoreTurn[];
};

// Whose turn it is now, and the next few turns. The chore rotates only among
// participants who are NOT on vacation, so an away housemate drops out of the
// loop entirely (rather than being skipped a single time).
export function choreSchedule(
  chore: Chore,
  onVacation: Set<string>,
  today: Date,
  upcomingCount = 3
): ChoreSchedule {
  const available = chore.participant_ids.filter((id) => !onVacation.has(id));

  const startMs = dateToUTC(chore.start_date);
  const todayMs = localDayUTC(today);
  const periodMs = chore.cadence_days * DAY_MS;
  const elapsed = Math.floor((todayMs - startMs) / periodMs);
  const currentPeriod = Math.max(0, elapsed);

  const assigneeFor = (period: number): string | null =>
    available.length === 0
      ? null
      : available[((period % available.length) + available.length) %
          available.length];

  const periodStartMs = startMs + currentPeriod * periodMs;
  const upcoming: ChoreTurn[] = [];
  for (let i = 1; i <= upcomingCount; i++) {
    const id = assigneeFor(currentPeriod + i);
    if (!id) break;
    upcoming.push({ assigneeId: id, date: utcToISO(periodStartMs + i * periodMs) });
  }

  return {
    currentAssigneeId: assigneeFor(currentPeriod),
    currentPeriodStart: utcToISO(periodStartMs),
    currentPeriodEnd: utcToISO(periodStartMs + periodMs),
    upcoming,
  };
}
