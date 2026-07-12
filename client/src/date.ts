export const pad = (n: number) => String(n).padStart(2, "0");

export const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const sameDay = (a: Date, b: Date) => fmtDate(a) === fmtDate(b);

export function getCalendarGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // luni = 0
  const gridStart = new Date(year, month, 1 - startOffset);
  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === month });
  }
  return days;
}

export function minutesUntil(dateStr: string, timeStr: string) {
  const target = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  return Math.round((target.getTime() - Date.now()) / 60000);
}
