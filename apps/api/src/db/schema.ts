import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Marcas de tiempo en milisegundos desde epoch. */

/** Un navegador identificado por la cookie `sf_device` (solo se guarda su hash). */
export const devices = sqliteTable(
  "devices",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    /** Pista de recuperación del organizador; nunca autoriza nada. */
    fingerprint: text("fingerprint"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("devices_token_hash_unique").on(table.tokenHash),
    index("devices_fingerprint_idx").on(table.fingerprint),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    name: text("name").notNull(),
    date: text("date"),
    budget: text("budget"),
    adminPasswordHash: text("admin_password_hash").notNull(),
    adminPasswordSalt: text("admin_password_salt").notNull(),
    failedLogins: integer("failed_logins").notNull().default(0),
    loginWindowStart: integer("login_window_start"),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [uniqueIndex("events_token_unique").on(table.token)],
);

export const eventAdmins = sqliteTable(
  "event_admins",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    deviceId: text("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.deviceId] }),
    index("event_admins_device_idx").on(table.deviceId),
  ],
);

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    deviceId: text("device_id").references(() => devices.id, { onDelete: "set null" }),
    claimedAt: integer("claimed_at"),
    revealedAt: integer("revealed_at"),
  },
  (table) => [
    uniqueIndex("participants_event_name_unique").on(table.eventId, table.name),
    uniqueIndex("participants_device_event_unique").on(table.deviceId, table.eventId),
  ],
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
