export interface PlannerEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  category: string; // id-ul categoriei (dinamic, per utilizator)
  notes: string;
  reminderMinutes: number | null;
  notified: boolean;
}

export type EventDraft = Omit<PlannerEvent, "id" | "notified"> & { id: string | null };

export interface Category {
  id: string;
  label: string;
  color: string;
}

// Hartă id -> {label,color} pentru afișare rapidă în componente.
export type CatMap = Record<string, { label: string; color: string }>;

// Afișat când un eveniment are o categorie ștearsă între timp.
export const FALLBACK_CATEGORY = { label: "Fără categorie", color: "#8A8A8A" };

export function catOf(map: CatMap, id: string) {
  return map[id] || FALLBACK_CATEGORY;
}

export const REMINDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Fără reminder" },
  { value: "5", label: "cu 5 minute înainte" },
  { value: "15", label: "cu 15 minute înainte" },
  { value: "30", label: "cu 30 minute înainte" },
  { value: "60", label: "cu 1 oră înainte" },
  { value: "1440", label: "cu 1 zi înainte" },
];

// Culori sugerate pentru categorii noi (utilizatorul poate alege și altele).
export const SUGGESTED_COLORS = [
  "#6FB8AE", "#D19A4A", "#C97B72", "#D6564A", "#9B8AC4",
  "#5BA3E0", "#E884B4", "#3FC9BE", "#E89A4A", "#8DA2C0",
];

export const DAY_LABELS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
export const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];
