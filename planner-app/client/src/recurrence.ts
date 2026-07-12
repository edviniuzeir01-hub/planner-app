import { PlannerEvent, Occurrence, Recurrence } from "./types";
import { fmtDate, parseDate } from "./date";

function step(cursor: Date, recurrence: Recurrence, start: Date) {
  if (recurrence === "daily") cursor.setDate(cursor.getDate() + 1);
  else if (recurrence === "weekly") cursor.setDate(cursor.getDate() + 7);
  else if (recurrence === "monthly") {
    const day = start.getDate();
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    cursor.setDate(Math.min(day, last));
  } else cursor.setFullYear(cursor.getFullYear() + 100);
}

/** Extinde un eveniment în ocurențele din intervalul [from, to]. */
export function expandEvent(ev: PlannerEvent, from: string, to: string): Occurrence[] {
  const mk = (d: string): Occurrence => ({ ...ev, occDate: d, key: `${ev.id}:${d}` });

  if (ev.recurrence === "none") {
    return ev.date >= from && ev.date <= to ? [mk(ev.date)] : [];
  }

  const hardEnd = ev.recurrenceEnd && ev.recurrenceEnd < to ? ev.recurrenceEnd : to;
  const start = parseDate(ev.date);
  const cursor = new Date(start);
  const out: Occurrence[] = [];

  let guard = 0;
  while (fmtDate(cursor) < from && guard++ < 3000) step(cursor, ev.recurrence, start);

  guard = 0;
  while (fmtDate(cursor) <= hardEnd && out.length < 400 && guard++ < 3000) {
    const s = fmtDate(cursor);
    if (s >= ev.date && s >= from) out.push(mk(s));
    step(cursor, ev.recurrence, start);
  }
  return out;
}

/** Extinde o listă de evenimente pe un interval. */
export function expandAll(events: PlannerEvent[], from: string, to: string): Occurrence[] {
  return events.flatMap((e) => expandEvent(e, from, to));
}
