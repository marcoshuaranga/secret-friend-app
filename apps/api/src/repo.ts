import type { Assignment } from "@secret-friend/core";
import { and, asc, eq, gt, inArray, isNull, lt, notExists, sql } from "drizzle-orm";
import { assignments, devices, eventAdmins, events, participants } from "./db/schema.ts";
import type { Db } from "./env.ts";

export type EventRow = typeof events.$inferSelect;
export type ParticipantRow = typeof participants.$inferSelect;

export interface NewEvent {
  readonly event: typeof events.$inferInsert;
  readonly participants: readonly { readonly id: string; readonly name: string }[];
  readonly assignments: readonly Assignment[];
  readonly adminDeviceId: string;
}

/** Acceso a D1. Cada función recibe primero la base (currying) y no conoce HTTP. */
export const crearRepo = (db: Db) => {
  const liveEvent = (now: number) => gt(events.expiresAt, now);

  return {
    findDeviceByTokenHash: async (tokenHash: string) =>
      (await db.select().from(devices).where(eq(devices.tokenHash, tokenHash)).limit(1))[0],

    insertDevice: (device: typeof devices.$inferInsert) => db.insert(devices).values(device),

    updateFingerprint: (deviceId: string, fingerprint: string) =>
      db.update(devices).set({ fingerprint }).where(eq(devices.id, deviceId)),

    findEventByToken: async (token: string, now: number): Promise<EventRow | undefined> =>
      (
        await db
          .select()
          .from(events)
          .where(and(eq(events.token, token), liveEvent(now)))
          .limit(1)
      )[0],

    findEventById: async (id: string, now: number): Promise<EventRow | undefined> =>
      (
        await db
          .select()
          .from(events)
          .where(and(eq(events.id, id), liveEvent(now)))
          .limit(1)
      )[0],

    /** Evento, participantes, asignaciones y admin en una sola transacción de D1. */
    createEvent: async (input: NewEvent): Promise<void> => {
      const idByName = new Map(input.participants.map((p) => [p.name, p.id]));
      const id = (name: string): string => idByName.get(name) ?? "";
      await db.batch([
        db.insert(events).values(input.event),
        db
          .insert(participants)
          .values(
            input.participants.map((p) => ({ id: p.id, eventId: input.event.id, name: p.name })),
          ),
        db.insert(assignments).values(
          input.assignments.map((a) => ({
            eventId: input.event.id,
            giverId: id(a.giver),
            receiverId: id(a.receiver),
          })),
        ),
        db.insert(eventAdmins).values({ eventId: input.event.id, deviceId: input.adminDeviceId }),
      ]);
    },

    listParticipants: (eventId: string): Promise<ParticipantRow[]> =>
      db
        .select()
        .from(participants)
        .where(eq(participants.eventId, eventId))
        .orderBy(asc(sql`rowid`)),

    isAdmin: async (eventId: string, deviceId: string): Promise<boolean> =>
      (
        await db
          .select({ eventId: eventAdmins.eventId })
          .from(eventAdmins)
          .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.deviceId, deviceId)))
          .limit(1)
      ).length > 0,

    addAdmin: (eventId: string, deviceId: string) =>
      db.insert(eventAdmins).values({ eventId, deviceId }).onConflictDoNothing(),

    /** Toma el nombre solo si sigue libre; devuelve si lo logró (carreras entre dispositivos). */
    claimParticipant: async (participantId: string, deviceId: string, now: number) => {
      const result = await db
        .update(participants)
        .set({ deviceId, claimedAt: now })
        .where(and(eq(participants.id, participantId), isNull(participants.deviceId)))
        .returning({ id: participants.id });
      return result.length === 1;
    },

    releaseParticipant: async (eventId: string, participantId: string) =>
      (
        await db
          .update(participants)
          .set({ deviceId: null, claimedAt: null, revealedAt: null })
          .where(and(eq(participants.id, participantId), eq(participants.eventId, eventId)))
          .returning({ id: participants.id })
      ).length === 1,

    markRevealed: (participantId: string, now: number) =>
      db
        .update(participants)
        .set({ revealedAt: now })
        .where(and(eq(participants.id, participantId), isNull(participants.revealedAt))),

    receiverOf: async (eventId: string, giverId: string): Promise<string | undefined> =>
      (
        await db
          .select({ name: participants.name })
          .from(assignments)
          .innerJoin(participants, eq(participants.id, assignments.receiverId))
          .where(and(eq(assignments.eventId, eventId), eq(assignments.giverId, giverId)))
          .limit(1)
      )[0]?.name,

    eventsAdministeredBy: (deviceId: string, now: number) =>
      db
        .select({
          id: events.id,
          token: events.token,
          name: events.name,
          date: events.date,
          budget: events.budget,
        })
        .from(eventAdmins)
        .innerJoin(events, eq(events.id, eventAdmins.eventId))
        .where(and(eq(eventAdmins.deviceId, deviceId), liveEvent(now)))
        .orderBy(asc(events.createdAt)),

    eventsJoinedBy: (deviceId: string, now: number) =>
      db
        .select({
          id: events.id,
          token: events.token,
          name: events.name,
          date: events.date,
          budget: events.budget,
          participantName: participants.name,
        })
        .from(participants)
        .innerJoin(events, eq(events.id, participants.eventId))
        .where(and(eq(participants.deviceId, deviceId), liveEvent(now)))
        .orderBy(asc(events.createdAt)),

    /** Eventos vigentes administrados por dispositivos con esa huella (solo pista). */
    recoveryCandidates: (fingerprint: string, now: number) =>
      db
        .selectDistinct({ id: events.id, name: events.name, date: events.date })
        .from(devices)
        .innerJoin(eventAdmins, eq(eventAdmins.deviceId, devices.id))
        .innerJoin(events, eq(events.id, eventAdmins.eventId))
        .where(and(eq(devices.fingerprint, fingerprint), liveEvent(now)))
        .limit(10),

    saveLoginThrottle: (eventId: string, failedLogins: number, windowStart: number | null) =>
      db
        .update(events)
        .set({ failedLogins, loginWindowStart: windowStart })
        .where(eq(events.id, eventId)),

    updateEvent: (
      eventId: string,
      changes: { name?: string; date?: string | null; budget?: string | null },
    ) => db.update(events).set(changes).where(eq(events.id, eventId)),

    deleteEvent: (eventId: string) => db.delete(events).where(eq(events.id, eventId)),

    /** Limpieza diaria: eventos vencidos y dispositivos sin eventos de más de 90 días. */
    cleanup: async (now: number, deviceCutoff: number): Promise<void> => {
      const expired = db.select({ id: events.id }).from(events).where(lt(events.expiresAt, now));
      await db.batch([
        db.delete(events).where(inArray(events.id, expired)),
        db
          .delete(devices)
          .where(
            and(
              lt(devices.createdAt, deviceCutoff),
              notExists(db.select().from(eventAdmins).where(eq(eventAdmins.deviceId, devices.id))),
              notExists(
                db.select().from(participants).where(eq(participants.deviceId, devices.id)),
              ),
            ),
          ),
      ]);
    },
  };
};

export type Repo = ReturnType<typeof crearRepo>;
