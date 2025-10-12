// مدل ساده برای جدول shows
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function initDb() {
  const db = await open({
    filename: "reservations.db",
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shows (
      id TEXT PRIMARY KEY,
      title TEXT,
      date TEXT,
      time TEXT,
      capacity INTEGER
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      national_id TEXT,
      count INTEGER,
      show_id TEXT,
      created_at TEXT
    );
  `);
  return db;
}