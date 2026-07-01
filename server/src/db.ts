import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "..", "planner.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    date           TEXT NOT NULL,          -- YYYY-MM-DD
    startTime      TEXT,                   -- HH:MM
    endTime        TEXT,
    category       TEXT NOT NULL DEFAULT 'altele',
    notes          TEXT,
    reminderMinutes INTEGER,               -- NULL = fără reminder
    notified       INTEGER NOT NULL DEFAULT 0,
    createdAt      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    endpoint  TEXT PRIMARY KEY,
    data      TEXT NOT NULL,               -- JSON al obiectului PushSubscription
    createdAt INTEGER NOT NULL
  );
`);

export interface EventRow {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  category: string;
  notes: string | null;
  reminderMinutes: number | null;
  notified: number;
  createdAt: number;
}

export interface SubscriptionRow {
  endpoint: string;
  data: string;
  createdAt: number;
}

export default db;
