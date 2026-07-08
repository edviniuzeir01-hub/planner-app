import { pool, mapEvent } from "./db";
import { sendToSpace } from "./push";

// Toleranță: trimitem reminderul dacă a devenit scadent și evenimentul nu a
// început cu mai mult de GRACE în urmă. Astfel un cron la 5 min nu ratează nimic.
const GRACE_MS = 10 * 60_000;

// Verifică reminderele scadente și trimite notificările. Întoarce câte a trimis.
export async function runReminders(): Promise<number> {
  const now = Date.now();
  const res = await pool.query(
    "SELECT * FROM events WHERE notified = FALSE AND reminder_minutes IS NOT NULL"
  );
  const rows = res.rows.map(mapEvent);

  let sent = 0;
  for (const ev of rows) {
    const start = new Date(`${ev.date}T${ev.startTime || "00:00"}:00`).getTime();
    if (Number.isNaN(start)) continue;

    const remindAt = start - ev.reminderMinutes! * 60_000;

    if (now >= remindAt && now <= start + GRACE_MS) {
      const label = describeLead(ev.reminderMinutes!);
      await sendToSpace(ev.spaceCode, {
        title: `⏰ ${ev.title}`,
        body: `Începe la ${ev.startTime || "?"}${label ? " (" + label + ")" : ""}`,
        eventId: ev.id,
        tag: ev.id,
      });
      await pool.query("UPDATE events SET notified = TRUE WHERE id = $1", [ev.id]);
      console.log(`[reminders] trimis: ${ev.title}`);
      sent++;
    }
  }
  return sent;
}

function describeLead(mins: number): string {
  if (mins >= 1440) return "cu 1 zi înainte";
  if (mins >= 60) return `cu ${Math.round(mins / 60)} h înainte`;
  return `cu ${mins} min înainte`;
}

// Scheduler intern — util cât serverul e oricum treaz. Reminderele „de încredere"
// vin însă de la cron-ul extern care apelează /api/run-reminders.
export function startScheduler() {
  runReminders().catch(console.error);
  setInterval(() => runReminders().catch(console.error), 30_000);
  console.log("[scheduler] pornit (verifică la fiecare 30s cât e treaz)");
}
