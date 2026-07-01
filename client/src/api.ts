import { PlannerEvent } from "./types";

// În dev, Vite proxează /api către :4000. În producție, serverul servește totul.
const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getConfig: () =>
    fetch(`${BASE}/config`).then((r) =>
      json<{ vapidPublicKey: string | null; pushEnabled: boolean }>(r)
    ),

  listEvents: () => fetch(`${BASE}/events`).then((r) => json<PlannerEvent[]>(r)),

  createEvent: (ev: Omit<PlannerEvent, "id" | "notified">) =>
    fetch(`${BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev),
    }).then((r) => json<PlannerEvent>(r)),

  updateEvent: (id: string, ev: Partial<PlannerEvent>) =>
    fetch(`${BASE}/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev),
    }).then((r) => json<PlannerEvent>(r)),

  deleteEvent: (id: string) =>
    fetch(`${BASE}/events/${id}`, { method: "DELETE" }).then((r) => json<void>(r)),

  subscribe: (sub: PushSubscription) =>
    fetch(`${BASE}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    }).then((r) => json<{ ok: boolean }>(r)),

  testPush: () => fetch(`${BASE}/test-push`, { method: "POST" }).then((r) => json<{ ok: boolean }>(r)),
};
