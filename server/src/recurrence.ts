// Logica de recurență: dintr-un eveniment „șablon" calculăm ocurențele concrete.

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Întoarce datele (YYYY-MM-DD) la care evenimentul apare, în intervalul [from, to].
 * Pentru recurrence="none" întoarce data originală dacă e în interval.
 */
export function occurrencesBetween(
  startDate: string,
  recurrence: Recurrence,
  recurrenceEnd: string | null,
  from: string,
  to: string,
  maxCount = 400
): string[] {
  if (recurrence === "none") {
    return startDate >= from && startDate <= to ? [startDate] : [];
  }

  const out: string[] = [];
  const hardEnd = recurrenceEnd && recurrenceEnd < to ? recurrenceEnd : to;
  const start = parse(startDate);
  const cursor = new Date(start);

  // Avansăm până intrăm în fereastră (fără să iterăm inutil de mult).
  let guard = 0;
  while (fmt(cursor) < from && guard++ < 5000) {
    step(cursor, recurrence, start);
  }

  guard = 0;
  while (fmt(cursor) <= hardEnd && out.length < maxCount && guard++ < 5000) {
    const s = fmt(cursor);
    if (s >= startDate && s >= from) out.push(s);
    step(cursor, recurrence, start);
  }
  return out;
}

function step(cursor: Date, recurrence: Recurrence, start: Date) {
  if (recurrence === "daily") {
    cursor.setDate(cursor.getDate() + 1);
  } else if (recurrence === "weekly") {
    cursor.setDate(cursor.getDate() + 7);
  } else if (recurrence === "monthly") {
    // Păstrăm ziua din luna de start; dacă luna e mai scurtă, folosim ultima zi.
    const day = start.getDate();
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    cursor.setDate(Math.min(day, last));
  } else {
    // none — ieșim din buclă
    cursor.setFullYear(cursor.getFullYear() + 100);
  }
}
