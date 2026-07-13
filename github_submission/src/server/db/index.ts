import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "sqlite.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Seed initial HCPs if empty
const count = sqlite.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='hcps'").get() as any;
if (count.c === 0) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hcps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT
    );
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hcp_name TEXT NOT NULL,
      interaction_type TEXT,
      date TEXT,
      time TEXT,
      attendees TEXT,
      topics_discussed TEXT,
      materials_shared TEXT,
      sentiment TEXT,
      outcomes TEXT,
      follow_up_actions TEXT,
      created_at INTEGER
    );
    INSERT INTO hcps (name, specialty) VALUES ('Dr. Smith', 'Oncology');
    INSERT INTO hcps (name, specialty) VALUES ('Dr. Sharma', 'Cardiology');
    INSERT INTO hcps (name, specialty) VALUES ('Dr. Jones', 'Neurology');
  `);
}
