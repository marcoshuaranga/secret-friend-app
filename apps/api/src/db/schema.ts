import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Marcas de tiempo en milisegundos desde epoch. */
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    adminTokenHash: text("admin_token_hash").notNull(),
    name: text("name").notNull(),
    date: text("date"),
    budget: text("budget"),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [uniqueIndex("events_token_unique").on(table.token)],
);

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    claimedAt: integer("claimed_at"),
    claimTokenHash: text("claim_token_hash"),
  },
  (table) => [uniqueIndex("participants_event_name_unique").on(table.eventId, table.name)],
);

export const assignments = sqliteTable(
  "assignments",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    giverId: text("giver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    receiverId: text("receiver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.giverId] })],
);
