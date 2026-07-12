import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { pool, initDb, mapEvent, mapCategory, EventRow } from "./db";
import { sendToSpace, isConfigured } from "./push";
import { startScheduler, runReminders } from "./scheduler";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 4000;

// Codul de calendar (identitatea utilizatorului) vine din header-ul X-Space.
function spaceOf(req: express.Request): string | null {
  const c = req.header("X-Space");
  return c && c.trim().length >= 8 ? c.trim() : null;
}

function requireSpace(req: express.Request, res: express.Response, next: express.NextFunction) {
  const code = spaceOf(req);
  if (!code) return res.status(400).json({ error: "cod de calendar lipsă" });
  (req as any).space = code;
  next();
}

// Wrapper ca rutele async să trimită erorile la handlerul global, nu să crape.
const wrap =
  (fn: (req: express.Request, res: express.Response) => Promise<any>) =>
  (req: express.Request, res: express.Response) =>
    fn(req, res).catch((err) => {
      console.error("[api]", err);
      if (!res.headersSent) res.status(500).json({ error: "eroare internă" });
    });

/* ---------- config public ---------- */
app.get("/api/config", (_req, res) => {
  res.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    pushEnabled: isConfigured(),
  });
});

/* ---------- events ---------- */
app.get(
  "/api/events",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    const r = await pool.query(
      "SELECT * FROM events WHERE space_code = $1 ORDER BY date, start_time",
      [space]
    );
    res.json(r.rows.map(mapEvent).map(toClient));
  })
);

app.post(
  "/api/events",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    const b = req.body || {};
    if (!b.title || !b.date) {
      return res.status(400).json({ error: "title și date sunt obligatorii" });
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO events (id, space_code, title, date, start_time, end_time, category, notes,
                           reminder_minutes, notified, all_day, priority, recurrence, recurrence_end, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,$10,$11,$12,$13,$14)`,
      [
        id,
        space,
        String(b.title),
        String(b.date),
        b.allDay ? null : b.startTime || null,
        b.allDay ? null : b.endTime || null,
        b.category || "personal",
        b.notes || null,
        b.reminderMinutes ?? null,
        !!b.allDay,
        b.priority || "normal",
        b.recurrence || "none",
        b.recurrenceEnd || null,
        Date.now(),
      ]
    );
    const r = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    res.status(201).json(toClient(mapEvent(r.rows[0])));
  })
);

app.put(
  "/api/events/:id",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    const er = await pool.query("SELECT * FROM events WHERE id = $1 AND space_code = $2", [
      req.params.id,
      space,
    ]);
    if (er.rows.length === 0) return res.status(404).json({ error: "eveniment inexistent" });
    const existing = mapEvent(er.rows[0]);

    const b = req.body || {};
    const timingChanged =
      b.date !== existing.date ||
      (b.startTime || null) !== existing.startTime ||
      (b.reminderMinutes ?? null) !== existing.reminderMinutes;

    const allDay = b.allDay ?? existing.allDay;
    await pool.query(
      `UPDATE events SET title=$1, date=$2, start_time=$3, end_time=$4,
         category=$5, notes=$6, reminder_minutes=$7, notified=$8,
         all_day=$9, priority=$10, recurrence=$11, recurrence_end=$12, last_notified=$13
       WHERE id=$14 AND space_code=$15`,
      [
        b.title ?? existing.title,
        b.date ?? existing.date,
        allDay ? null : b.startTime ?? existing.startTime,
        allDay ? null : b.endTime ?? existing.endTime,
        b.category ?? existing.category,
        b.notes ?? existing.notes,
        b.reminderMinutes ?? existing.reminderMinutes,
        timingChanged ? false : existing.notified,
        allDay,
        b.priority ?? existing.priority,
        b.recurrence ?? existing.recurrence,
        b.recurrenceEnd ?? existing.recurrenceEnd,
        timingChanged ? null : existing.lastNotified,
        req.params.id,
        space,
      ]
    );
    const r = await pool.query("SELECT * FROM events WHERE id = $1", [req.params.id]);
    res.json(toClient(mapEvent(r.rows[0])));
  })
);

app.delete(
  "/api/events/:id",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    await pool.query("DELETE FROM events WHERE id = $1 AND space_code = $2", [
      req.params.id,
      space,
    ]);
    res.status(204).end();
  })
);

/* ---------- categorii (per calendar, cu seed automat) ---------- */
const DEFAULT_CATEGORIES = [
  { id: "work", label: "Muncă", color: "#5BA3E0" },
  { id: "personal", label: "Personal", color: "#6FB8AE" },
  { id: "health", label: "Sănătate", color: "#7FC08A" },
  { id: "social", label: "Social", color: "#E884B4" },
  { id: "important", label: "Important", color: "#D6564A" },
];

async function seedIfEmpty(space: string) {
  const c = await pool.query("SELECT COUNT(*)::int AS n FROM categories WHERE space_code = $1", [
    space,
  ]);
  if (c.rows[0].n > 0) return;
  const now = Date.now();
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    await pool.query(
      "INSERT INTO categories (id, space_code, label, color, sort_order, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
      [cat.id, space, cat.label, cat.color, i, now]
    );
  }
}

app.get(
  "/api/categories",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    await seedIfEmpty(space);
    const r = await pool.query(
      "SELECT * FROM categories WHERE space_code = $1 ORDER BY sort_order, created_at",
      [space]
    );
    res.json(r.rows.map(mapCategory).map((c) => ({ id: c.id, label: c.label, color: c.color })));
  })
);

app.post(
  "/api/categories",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    const b = req.body || {};
    if (!b.label || !b.color) return res.status(400).json({ error: "label și color obligatorii" });
    const id = crypto.randomUUID();
    const m = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1)::int AS m FROM categories WHERE space_code = $1",
      [space]
    );
    await pool.query(
      "INSERT INTO categories (id, space_code, label, color, sort_order, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, space, String(b.label), String(b.color), m.rows[0].m + 1, Date.now()]
    );
    res.status(201).json({ id, label: b.label, color: b.color });
  })
);

app.put(
  "/api/categories/:id",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    const b = req.body || {};
    const er = await pool.query("SELECT * FROM categories WHERE space_code = $1 AND id = $2", [
      space,
      req.params.id,
    ]);
    if (er.rows.length === 0) return res.status(404).json({ error: "categorie inexistentă" });
    const existing = mapCategory(er.rows[0]);
    await pool.query("UPDATE categories SET label = $1, color = $2 WHERE space_code = $3 AND id = $4", [
      b.label ?? existing.label,
      b.color ?? existing.color,
      space,
      req.params.id,
    ]);
    res.json({ id: req.params.id, label: b.label ?? existing.label, color: b.color ?? existing.color });
  })
);

app.delete(
  "/api/categories/:id",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    await pool.query("DELETE FROM categories WHERE space_code = $1 AND id = $2", [
      space,
      req.params.id,
    ]);
    res.status(204).end();
  })
);

/* ---------- push subscriptions ---------- */
app.post(
  "/api/subscribe",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: "subscription invalid" });
    await pool.query(
      `INSERT INTO subscriptions (endpoint, space_code, data, created_at) VALUES ($1,$2,$3,$4)
       ON CONFLICT (endpoint) DO UPDATE SET data = EXCLUDED.data, space_code = EXCLUDED.space_code`,
      [sub.endpoint, space, JSON.stringify(sub), Date.now()]
    );
    res.status(201).json({ ok: true });
  })
);

app.post(
  "/api/unsubscribe",
  requireSpace,
  wrap(async (req, res) => {
    const { endpoint } = req.body || {};
    if (endpoint) await pool.query("DELETE FROM subscriptions WHERE endpoint = $1", [endpoint]);
    res.json({ ok: true });
  })
);

app.post(
  "/api/test-push",
  requireSpace,
  wrap(async (req, res) => {
    const space = (req as any).space as string;
    await sendToSpace(space, {
      title: "🔔 Test reminder",
      body: "Notificările funcționează. Ești gata de treabă!",
      eventId: "test",
    });
    res.json({ ok: true });
  })
);

/* ---------- endpoint apelat de cron-ul extern (cron-job.org) ---------- */
const handleRunReminders = wrap(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.query.key || req.header("X-Cron-Key");
    if (provided !== secret) return res.status(401).json({ error: "cheie invalidă" });
  }
  const sent = await runReminders();
  res.json({ ok: true, sent });
});
app.get("/api/run-reminders", handleRunReminders);
app.post("/api/run-reminders", handleRunReminders);

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
    allDay: !!r.allDay,
    priority: r.priority || "normal",
    recurrence: r.recurrence || "none",
    recurrenceEnd: r.recurrenceEnd || "",
  };
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] pornit pe http://localhost:${PORT}`);
      startScheduler();
    });
  })
  .catch((err) => {
    console.error("[db] inițializarea a eșuat:", err);
    process.exit(1);
  });
