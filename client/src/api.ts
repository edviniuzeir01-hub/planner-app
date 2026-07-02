import { PlannerEvent, Category } from "./types";
import { getSpace } from "./space";

// În dev, Vite proxează /api către :4000. În producție, serverul servește totul.
const BASE = "/api";

function headers(): HeadersInit {
  return { "Content-Type": "application/json", "X-Space": getSpace() };
}

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

  listEvents: () => fetch(`${BASE}/events`, { headers: headers() }).then((r) => json<PlannerEvent[]>(r)),

  createEvent: (ev: Omit<PlannerEvent, "id" | "notified">) =>
    fetch(`${BASE}/events`, { method: "POST", headers: headers(), body: JSON.stringify(ev) }).then(
      (r) => json<PlannerEvent>(r)
    ),

  updateEvent: (id: string, ev: Partial<PlannerEvent>) =>
    fetch(`${BASE}/events/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(ev) }).then(
      (r) => json<PlannerEvent>(r)
    ),

  deleteEvent: (id: string) =>
    fetch(`${BASE}/events/${id}`, { method: "DELETE", headers: headers() }).then((r) => json<void>(r)),

  listCategories: () =>
    fetch(`${BASE}/categories`, { headers: headers() }).then((r) => json<Category[]>(r)),

  createCategory: (c: { label: string; color: string }) =>
    fetch(`${BASE}/categories`, { method: "POST", headers: headers(), body: JSON.stringify(c) }).then(
      (r) => json<Category>(r)
    ),

  updateCategory: (id: string, c: { label?: string; color?: string }) =>
    fetch(`${BASE}/categories/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(c) }).then(
      (r) => json<Category>(r)
    ),

  deleteCategory: (id: string) =>
    fetch(`${BASE}/categories/${id}`, { method: "DELETE", headers: headers() }).then((r) => json<void>(r)),

  subscribe: (sub: PushSubscription) =>
    fetch(`${BASE}/subscribe`, { method: "POST", headers: headers(), body: JSON.stringify(sub) }).then(
      (r) => json<{ ok: boolean }>(r)
    ),

  testPush: () =>
    fetch(`${BASE}/test-push`, { method: "POST", headers: headers() }).then((r) => json<{ ok: boolean }>(r)),
};
