import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import db, { EventRow } from "./db";
import { sendToAll, isConfigured } from "./push";
import { startScheduler } from "./scheduler";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 4000;

/* ---------- config public (cheia VAPID pentru client) ---------- */
app.get("/api/config", (_req, res) => {
  res.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    pushEnabled: isConfigured(),
  });
});

/* ---------- events ---------- */
app.get("/api/events", (_req, res) => {
  const rows = db.prepare("SELECT * FROM events ORDER BY date, startTime").all() as EventRow[];
  res.json(rows.map(toClient));
});

app.post("/api/events", (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.date) {
    return res.status(400).json({ error: "title și date sunt obligatorii" });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO events (id, title, date, startTime, endTime, category, notes, reminderMinutes, notified, createdAt)
     VALUES (@id, @title, @date, @startTime, @endTime, @category, @notes, @reminderMinutes, 0, @createdAt)`
  ).run({
    id,
    title: String(b.title),
    date: String(b.date),
    startTime: b.startTime || null,
    endTime: b.endTime || null,
    category: b.category || "altele",
    notes: b.notes || null,
    reminderMinutes: b.reminderMinutes ?? null,
    createdAt: Date.now(),
  });
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as EventRow;
  res.status(201).json(toClient(row));
});

app.put("/api/events/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id) as
    | EventRow
    | undefined;
  if (!existing) return res.status(404).json({ error: "eveniment inexistent" });

  const b = req.body || {};
  // Dacă s-a schimbat momentul, resetăm flag-ul notified ca reminderul să se retrimită.
  const timingChanged =
    b.date !== existing.date ||
    (b.startTime || null) !== existing.startTime ||
    (b.reminderMinutes ?? null) !== existing.reminderMinutes;

  db.prepare(
    `UPDATE events SET title=@title, date=@date, startTime=@startTime, endTime=@endTime,
       category=@category, notes=@notes, reminderMinutes=@reminderMinutes, notified=@notified
     WHERE id=@id`
  ).run({
    id: req.params.id,
    title: b.title ?? existing.title,
    date: b.date ?? existing.date,
    startTime: b.startTime ?? existing.startTime,
    endTime: b.endTime ?? existing.endTime,
    category: b.category ?? existing.category,
    notes: b.notes ?? existing.notes,
    reminderMinutes: b.reminderMinutes ?? existing.reminderMinutes,
    notified: timingChanged ? 0 : existing.notified,
  });
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id) as EventRow;
  res.json(toClient(row));
});

app.delete("/api/events/:id", (req, res) => {
  db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

/* ---------- push subscriptions ---------- */
app.post("/api/subscribe", (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: "subscription invalid" });
  db.prepare(
    `INSERT INTO subscriptions (endpoint, data, createdAt) VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET data = excluded.data`
  ).run(sub.endpoint, JSON.stringify(sub), Date.now());
  res.status(201).json({ ok: true });
});

app.post("/api/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) db.prepare("DELETE FROM subscriptions WHERE endpoint = ?").run(endpoint);
  res.json({ ok: true });
});

// Notificare de test — utilă ca să verifici că push-ul merge.
app.post("/api/test-push", async (_req, res) => {
  await sendToAll({
    title: "🔔 Test reminder",
    body: "Notificările funcționează. Ești gata de treabă!",
    eventId: "test",
  });
  res.json({ ok: true });
});

/* ---------- servește build-ul de client (producție) ---------- */
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).send("Client neconstruit. Rulează `npm run build` în /client.");
  });
});

function toClient(r: EventRow) {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.startTime || "",
    endTime: r.endTime || "",
    category: r.category,
    notes: r.notes || "",
    reminderMinutes: r.reminderMinutes,
    notified: !!r.notified,
  };
}

app.listen(PORT, () => {
  console.log(`[server] pornit pe http://localhost:${PORT}`);
  startScheduler();
});
