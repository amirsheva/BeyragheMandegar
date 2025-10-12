// server/schema.js

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// اتصال به دیتابیس SQLite
const sqlite = new Database("./reservations.db");
export const db = drizzle(sqlite); // ✅ حالا db صادر می‌شود

// جدول سانس‌ها
export const shows = sqliteTable("shows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  capacity: integer("capacity").notNull(),
});

// جدول رزروها
export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  national_id: text("national_id").notNull(),
  count: integer("count").notNull(),
  show_id: integer("show_id").notNull(),
  created_at: text("created_at").default(""),
});