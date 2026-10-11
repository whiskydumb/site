import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const guestbookEntries = sqliteTable("guestbook_entries", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  message: text().notNull(),
  reply: text(),
  isPrivate: integer({ mode: "boolean" }).notNull().default(false),
  status: text({ enum: ["pending", "approved"] }).notNull().default("pending"),
  ipHash: text().notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const guestbookBans = sqliteTable("guestbook_bans", {
  ipHash: text().primaryKey(),
  expiresAt: integer({ mode: "timestamp" }),
})
