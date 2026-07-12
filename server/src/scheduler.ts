import { pool, mapEvent } from "./db";
import { sendToSpace } from "./push";
import { occurrencesBetween, Recurrence } from "./recurrence";

// Toleranță: nu ratăm un reminder dacă cron-ul rulează la 5 min.
const GRACE_MS = 15 * 60_000;

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Verifică reminderele scadente (inclusiv pentru evenimente recurente) și trimite
 * notificările. Pentru recurente folosim last_notified = data ultimei ocurențe notificate,
 * ca fiecare repetare să declanșeze propriul reminder.
 */
export async function runReminders(): Promise<number> {
  const now = Date.now();
  const res = await pool.query(
    "SELECT * FROM events WHERE reminder_minutes IS NOT NULL"
  );
  const rows = res.rows.map(mapEvent);

  // Fereastră de căutare: ieri -> mâine (acoperă remindere „cu 1 zi înainte").
  const from = fmt(new Date(now - 2 * 86400_000));
  const to = fmt(new Date(now + 2 * 86400_000));

  let sent = 0;

  for (const ev of rows) {
    const isRecurring = (ev.recurrence as Recurrence) !== "none";

    // Evenimentele simple deja notificate le sărim.
    if (!isRecurring && ev.notified) continue;

    const dates = occurrencesBetween(
      ev.date,
      (ev.recurrence as Recurrence) || "none",
      ev.recurrenceEnd,
      from,
      to
    );

    for (const occDate of dates) {
      // Pentru recurente: nu retrimitem aceeași ocurență.
      if (isRecurring && ev.lastNotified === occDate) continue;

      // Evenimentele "toată ziua" folosesc 09:00 ca moment de referință.
      const refTime = ev.allDay ? "09:00" : ev.startTime || "00:00";
      const start = new Date(`${occDate}T${refTime}:00`).getTime();
      if (Number.isNaN(start)) continue;

      const remindAt = start - ev.reminderMinutes! * 60_000;

      if (now >= remindAt && now <= start + GRACE_MS) {
        await sendToSpace(ev.spaceCode, {
          title: `⏰ ${ev.title}`,
          body: buildBody(ev.allDay, ev.startTime, ev.reminderMinutes!),
          eventId: ev.id,
          tag: `${ev.id}:${occDate}`,
        });

        if (isRecurring) {
          await pool.query("UPDATE events SET last_notified = $1 WHERE id = $2", [
            occDate,
            ev.id,
          ]);
        } else {
          await pool.query("UPDATE events SET notified = TRUE WHERE id = $1", [ev.id]);
        }
        console.log(`[reminders] trimis: ${ev.title} (${occDate})`);
        sent++;
        break; // o singură ocurență per rulare per eveniment
      }
    }
  }
  return sent;
}

function buildBody(allDay: boolean, startTime: string | null, mins: number): string {
  const lead = describeLead(mins);
  if (allDay) return `Astăzi${lead ? " · " + lead : ""}`;
  return `Începe la ${startTime || "?"}${lead ? " · " + lead : ""}`;
}

function describeLead(mins: number): string {
  if (mins >= 1440) {
    const d = Math.round(mins / 1440);
    return d === 1 ? "cu 1 zi înainte" : `cu ${d} zile înainte`;
  }
  if (mins >= 60) {
    const h = Math.round(mins / 60);
    return h === 1 ? "cu 1 oră înainte" : `cu ${h} ore înainte`;
  }
  return `cu ${mins} min înainte`;
}

// Scheduler intern — util cât serverul e treaz. Reminderele de încredere vin de la
// cron-ul extern care apelează /api/run-reminders.
export function startScheduler() {
  runReminders().catch(console.error);
  setInterval(() => runReminders().catch(console.error), 30_000);
  console.log("[scheduler] pornit (verifică la fiecare 30s cât e treaz)");
}
