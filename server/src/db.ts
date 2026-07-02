import Database from "better-sqlite3";
import path from "path";

// DATA_DIR permite pointarea către un disc persistent (ex. pe Render).
// Implicit: folderul server (bun pentru rulare locală).
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..");
const db = new Database(path.join(dataDir, "planner.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id             TEXT PRIMARY KEY,
    spaceCode      TEXT NOT NULL DEFAULT '',   -- calendarul (utilizatorul) căruia îi aparține
    title          TEXT NOT NULL,
    date           TEXT NOT NULL,              -- YYYY-MM-DD
    startTime      TEXT,                       -- HH:MM
    endTime        TEXT,
    category       TEXT NOT NULL DEFAULT 'altele',
    notes          TEXT,
    reminderMinutes INTEGER,                   -- NULL = fără reminder
    notified       INTEGER NOT NULL DEFAULT 0,
    createdAt      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    endpoint  TEXT PRIMARY KEY,
    spaceCode TEXT NOT NULL DEFAULT '',        -- abonamentul de push al acelui calendar
    data      TEXT NOT NULL,                   -- JSON al obiectului PushSubscription
    createdAt INTEGER NOT NULL
  );
`);

// Migrație ușoară: adaugă coloana spaceCode dacă o bază de date veche nu o are.
function ensureColumn(table: string, col: string, def: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === col)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  }
}
ensureColumn("events", "spaceCode", "TEXT NOT NULL DEFAULT ''");
ensureColumn("subscriptions", "spaceCode", "TEXT NOT NULL DEFAULT ''");

db.exec(`CREATE INDEX IF NOT EXISTS idx_events_space ON events(spaceCode);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_subs_space ON subscriptions(spaceCode);`);

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
  notified: number;
  createdAt: number;
}

export interface SubscriptionRow {
  endpoint: string;
  spaceCode: string;
  data: string;
  createdAt: number;
}

export default db;
