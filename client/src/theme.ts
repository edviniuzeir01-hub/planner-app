// Teme de culoare. Alegerea se salvează local (per dispozitiv / utilizator).

export interface Theme {
  id: string;
  label: string;
  bg: string; // culoarea de fundal (pentru swatch și bara de status)
  accent: string;
}

export const THEMES: Theme[] = [
  { id: "green", label: "Verde", bg: "#0D1B12", accent: "#D19A4A" },
  { id: "blue", label: "Albastru", bg: "#0C1424", accent: "#5BA3E0" },
  { id: "pink", label: "Roz", bg: "#1E0F1A", accent: "#E884B4" },
  { id: "red", label: "Roșu", bg: "#1C0D0D", accent: "#E86A5E" },
  { id: "purple", label: "Mov", bg: "#140E1F", accent: "#B18AE8" },
  { id: "orange", label: "Portocaliu", bg: "#1E140A", accent: "#E89A4A" },
  { id: "teal", label: "Turcoaz", bg: "#08191A", accent: "#3FC9BE" },
  { id: "graphite", label: "Grafit", bg: "#12151A", accent: "#8DA2C0" },
  { id: "light", label: "Deschis", bg: "#F5F2E8", accent: "#C08A3A" },
];

const KEY = "planner:theme";

export function getTheme(): string {
  return localStorage.getItem(KEY) || "green";
}

export function applyTheme(id: string) {
  document.documentElement.setAttribute("data-theme", id);
  const t = THEMES.find((x) => x.id === id);
  if (t) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t.bg);
  }
}

export function setTheme(id: string) {
  localStorage.setItem(KEY, id);
  applyTheme(id);
}
