import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import db, { EventRow } from "./db";
import { sendToSpace, isConfigured } from "./push";
import { startScheduler } from "./scheduler";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 4000;

// Codul de calendar (identitatea utilizatorului) vine din header-ul X-Space.
function spaceOf(req: express.Request): string | null {
  const c = req.header("X-Space");
  return c && c.trim().length >= 8 ? c.trim() : null;
}

// Middleware care cere un cod valid pentru rutele de date.
function requireSpace(req: express.Request, res: express.Response, next: express.NextFunction) {
  const code = spaceOf(req);
  if (!code) return res.status(400).json({ error: "cod de calendar lipsă" });
  (req as any).space = code;
  next();
}

/* ---------- config public (cheia VAPID pentru client) ---------- */
app.get("/api/config", (_req, res) => {
  res.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    pushEnabled: isConfigured(),
  });
});

/* ---------- events (toate filtrate pe calendarul curent) ---------- */
app.get("/api/events", requireSpace, (req, res) => {
  const space = (req as any).space as string;
  const rows = db
    .prepare("SELECT * FROM events WHERE spaceCode = ? ORDER BY date, startTime")
    .all(space) as EventRow[];
  res.json(rows.map(toClient));
});

app.post("/api/events", requireSpace, (req, res) => {
  const space = (req as any).space as string;
  const b = req.body || {};
  if (!b.title || !b.date) {
    return res.status(400).json({ error: "title și date sunt obligatorii" });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO events (id, spaceCode, title, date, startTime, endTime, category, notes, reminderMinutes, notified, createdAt)
     VALUES (@id, @spaceCode, @title, @date, @startTime, @endTime, @category, @notes, @reminderMinutes, 0, @createdAt)`
  ).run({
    id,
    spaceCode: space,
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

app.put("/api/events/:id", requireSpace, (req, res) => {
  const space = (req as any).space as string;
  const existing = db
    .prepare("SELECT * FROM events WHERE id = ? AND spaceCode = ?")
    .get(req.params.id, space) as EventRow | undefined;
  if (!existing) return res.status(404).json({ error: "eveniment inexistent" });

  const b = req.body || {};
  const timingChanged =
    b.date !== existing.date ||
    (b.startTime || null) !== existing.startTime ||
    (b.reminderMinutes ?? null) !== existing.reminderMinutes;

  db.prepare(
    `UPDATE events SET title=@title, date=@date, startTime=@startTime, endTime=@endTime,
       category=@category, notes=@notes, reminderMinutes=@reminderMinutes, notified=@notified
     WHERE id=@id AND spaceCode=@spaceCode`
  ).run({
    id: req.params.id,
    spaceCode: space,
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

app.delete("/api/events/:id", requireSpace, (req, res) => {
  const space = (req as any).space as string;
  db.prepare("DELETE FROM events WHERE id = ? AND spaceCode = ?").run(req.params.id, space);
  res.status(204).end();
});

/* ---------- push subscriptions (legate de calendar) ---------- */
app.post("/api/subscribe", requireSpace, (req, res) => {
  const space = (req as any).space as string;
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: "subscription invalid" });
  db.prepare(
    `INSERT INTO subscriptions (endpoint, spaceCode, data, createdAt) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET data = excluded.data, spaceCode = excluded.spaceCode`
  ).run(sub.endpoint, space, JSON.stringify(sub), Date.now());
  res.status(201).json({ ok: true });
});

app.post("/api/unsubscribe", requireSpace, (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) db.prepare("DELETE FROM subscriptions WHERE endpoint = ?").run(endpoint);
  res.json({ ok: true });
});

// Notificare de test — doar către calendarul curent.
app.post("/api/test-push", requireSpace, async (req, res) => {
  const space = (req as any).space as string;
  await sendToSpace(space, {
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
