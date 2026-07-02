import db, { EventRow } from "./db";
import { sendToSpace } from "./push";

// Verifică ce evenimente au reminderul scadent și trimite notificarea
// doar către abonamentele calendarului care deține evenimentul.
async function tick() {
  const now = Date.now();
  const rows = db
    .prepare("SELECT * FROM events WHERE notified = 0 AND reminderMinutes IS NOT NULL")
    .all() as EventRow[];

  for (const ev of rows) {
    const start = new Date(`${ev.date}T${ev.startTime || "00:00"}:00`).getTime();
    if (Number.isNaN(start)) continue;

    const remindAt = start - ev.reminderMinutes! * 60_000;

    if (now >= remindAt && now <= start) {
      const label = describeLead(ev.reminderMinutes!);
      await sendToSpace(ev.spaceCode, {
        title: `⏰ ${ev.title}`,
        body: `Începe la ${ev.startTime || "?"}${label ? " (" + label + ")" : ""}`,
        eventId: ev.id,
        tag: ev.id,
      });
      db.prepare("UPDATE events SET notified = 1 WHERE id = ?").run(ev.id);
      console.log(`[scheduler] reminder trimis: ${ev.title}`);
    }
  }
}

function describeLead(mins: number): string {
  if (mins >= 1440) return "cu 1 zi înainte";
  if (mins >= 60) return `cu ${Math.round(mins / 60)} h înainte`;
  return `cu ${mins} min înainte`;
}

export function startScheduler() {
  tick().catch(console.error);
  setInterval(() => tick().catch(console.error), 30_000);
  console.log("[scheduler] pornit (verifică la fiecare 30s)");
}
