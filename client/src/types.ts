export interface PlannerEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  category: CategoryKey;
  notes: string;
  reminderMinutes: number | null;
  notified: boolean;
}

export type EventDraft = Omit<PlannerEvent, "id" | "notified"> & { id: string | null };

export type CategoryKey = "curs" | "proiect" | "personal" | "termen" | "altele";

export const CATEGORIES: Record<CategoryKey, { label: string; color: string }> = {
  curs: { label: "Curs", color: "#6FB8AE" },
  proiect: { label: "Proiect", color: "#D19A4A" },
  personal: { label: "Personal", color: "#C97B72" },
  termen: { label: "Termen limită", color: "#D6564A" },
  altele: { label: "Altele", color: "#9B8AC4" },
};

export const REMINDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Fără reminder" },
  { value: "5", label: "cu 5 minute înainte" },
  { value: "15", label: "cu 15 minute înainte" },
  { value: "30", label: "cu 30 minute înainte" },
  { value: "60", label: "cu 1 oră înainte" },
  { value: "1440", label: "cu 1 zi înainte" },
];

export const DAY_LABELS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
export const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];
