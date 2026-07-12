export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type Priority = "low" | "normal" | "high";

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD (data de start / prima ocurență)
  startTime: string;     // HH:MM ("" dacă e toată ziua)
  endTime: string;
  category: string;
  notes: string;
  reminderMinutes: number | null;
  notified: boolean;
  allDay: boolean;
  priority: Priority;
  recurrence: Recurrence;
  recurrenceEnd: string; // "" = fără sfârșit
}

// O ocurență concretă afișată în calendar (evenimentele recurente produc mai multe).
export interface Occurrence extends PlannerEvent {
  occDate: string;       // data acestei apariții
  key: string;           // id + dată (unic pentru React)
}

export type EventDraft = Omit<PlannerEvent, "id" | "notified"> & { id: string | null };

export interface Category {
  id: string;
  label: string;
  color: string;
}

export type CatMap = Record<string, { label: string; color: string }>;

export function catOf(map: CatMap, id: string, fallbackLabel: string) {
  return map[id] || { label: fallbackLabel, color: "#8A8A8A" };
}

export const SUGGESTED_COLORS = [
  "#5BA3E0", "#6FB8AE", "#7FC08A", "#E884B4", "#D6564A",
  "#D19A4A", "#9B8AC4", "#3FC9BE", "#E89A4A", "#8DA2C0",
];

// Presetări de reminder (în minute). „custom" deschide un câmp liber.
export const REMINDER_PRESETS = [0, 5, 15, 30, 60, 120, 1440, 2880];
