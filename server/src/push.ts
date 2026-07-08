import webpush from "web-push";
import { pool, mapSubscription } from "./db";

const publicKey = process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:example@example.com";

let configured = false;
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
} else {
  console.warn(
    "[push] Chei VAPID lipsă. Rulează `npm run genkeys` și completează .env. " +
      "Notificările push nu vor funcționa până atunci."
  );
}

export function isConfigured() {
  return configured;
}

export interface PushPayload {
  title: string;
  body: string;
  eventId: string;
  tag?: string;
}

// Trimite doar către abonamentele calendarului (spaceCode) dat.
export async function sendToSpace(spaceCode: string, payload: PushPayload) {
  if (!configured) return;
  const res = await pool.query("SELECT * FROM subscriptions WHERE space_code = $1", [spaceCode]);
  const subs = res.rows.map(mapSubscription);
  const json = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(JSON.parse(row.data), json);
      } catch (err: any) {
        // 404/410 = subscription expirat -> îl ștergem
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await pool.query("DELETE FROM subscriptions WHERE endpoint = $1", [row.endpoint]);
        } else {
          console.error("[push] eroare la trimitere:", err?.statusCode || err);
        }
      }
    })
  );
}
