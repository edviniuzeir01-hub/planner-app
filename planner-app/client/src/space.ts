// Gestionează codul privat al calendarului (identitatea utilizatorului).
// E stocat local pe dispozitiv. Fiecare persoană are propriul cod => propriul calendar.

const KEY = "planner:space";

function genCode(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return uuid.replace(/-/g, "");
}

// Dacă în URL există #code=..., îl adoptăm (util pentru sincronizare între dispozitive).
export function adoptCodeFromUrl() {
  const hash = window.location.hash;
  const m = hash.match(/code=([A-Za-z0-9]+)/);
  if (m && m[1].length >= 8) {
    localStorage.setItem(KEY, m[1]);
    // curățăm URL-ul ca să nu rămână codul vizibil
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

export function getSpace(): string {
  let c = localStorage.getItem(KEY);
  if (!c) {
    c = genCode();
    localStorage.setItem(KEY, c);
  }
  return c;
}

export function setSpace(code: string) {
  localStorage.setItem(KEY, code.trim());
}

export function shareLink(): string {
  return `${window.location.origin}/#code=${getSpace()}`;
}
