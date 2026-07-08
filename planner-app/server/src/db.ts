import { Pool } from "pg";

// DATABASE_URL vine de la Neon (sau alt Postgres). Ex:
//   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "[db] Lipsește DATABASE_URL. Creează o bază pe https://neon.tech și pune " +
      "connection string-ul în variabila de mediu DATABASE_URL."
  );
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes("localhost")
    ? { rejectUnauthorized: false }
    : undefined,
  max: 5,
});

// Creează tabelele dacă nu există. Rulează o dată la pornirea serverului.
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id              TEXT PRIMARY KEY,
      space_code      TEXT NOT NULL DEFAULT '',
      title           TEXT NOT NULL,
      date            TEXT NOT NULL,
      start_time      TEXT,
      end_time        TEXT,
      category        TEXT NOT NULL DEFAULT 'altele',
      notes           TEXT,
      reminder_minutes INTEGER,
      notified        BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_space ON events(space_code);

    CREATE TABLE IF NOT EXISTS subscriptions (
      endpoint   TEXT PRIMARY KEY,
      space_code TEXT NOT NULL DEFAULT '',
      data       TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_subs_space ON subscriptions(space_code);

    CREATE TABLE IF NOT EXISTS categories (
      id         TEXT NOT NULL,
      space_code TEXT NOT NULL,
      label      TEXT NOT NULL,
      color      TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (space_code, id)
    );
    CREATE INDEX IF NOT EXISTS idx_cats_space ON categories(space_code);
  `);
  console.log("[db] tabele verificate/create");
}

/* Interfețe în stil camelCase folosite de restul codului. */
export interface EventRow {
  id: string;
  spaceCode: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  category: string;
  notes: string | null;
  reminderMinutes: number | null;
  notified: boolean;
  createdAt: number;
}

export interface SubscriptionRow {
  endpoint: string;
  spaceCode: string;
  data: string;
  createdAt: number;
}

export interface CategoryRow {
  id: string;
  spaceCode: string;
  label: string;
  color: string;
  sortOrder: number;
  createdAt: number;
}

/* Mapări rând SQL (snake_case) -> obiect TS (camelCase). */
export function mapEvent(r: any): EventRow {
  return {
    id: r.id,
    spaceCode: r.space_code,
    title: r.title,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    category: r.category,
    notes: r.notes,
    reminderMinutes: r.reminder_minutes,
    notified: r.notified,
    createdAt: Number(r.created_at),
  };
}

export function mapSubscription(r: any): SubscriptionRow {
  return {
    endpoint: r.endpoint,
    spaceCode: r.space_code,
    data: r.data,
    createdAt: Number(r.created_at),
  };
}

export function mapCategory(r: any): CategoryRow {
  return {
    id: r.id,
    spaceCode: r.space_code,
    label: r.label,
    color: r.color,
    sortOrder: r.sort_order,
    createdAt: Number(r.created_at),
  };
}
