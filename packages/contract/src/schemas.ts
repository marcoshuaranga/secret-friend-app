import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from "@secret-friend/core";
import * as z from "zod/mini";

export const EVENT_NAME_MAX = 80;
export const PARTICIPANT_NAME_MAX = 60;
export const BUDGET_MAX = 40;

/** Texto recortado, no vacío y con largo máximo. */
const text = (max: number) => z.string().check(z.trim(), z.minLength(1), z.maxLength(max));

const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD"));

const hasUniqueNames = (names: readonly string[]): boolean =>
  new Set(names.map((name) => name.toLowerCase())).size === names.length;

/** Token público de un evento: aleatorio, largo y seguro para URL. */
export const eventTokenSchema = z.string().check(z.regex(/^[A-Za-z0-9_-]{22,64}$/));

/** POST /api/events */
export const createEventSchema = z.object({
  name: text(EVENT_NAME_MAX),
  participants: z
    .array(text(PARTICIPANT_NAME_MAX))
    .check(
      z.minLength(MIN_PARTICIPANTS),
      z.maxLength(MAX_PARTICIPANTS),
      z.refine(hasUniqueNames, "Los nombres de los participantes deben ser únicos"),
    ),
  date: z.optional(isoDate),
  budget: z.optional(text(BUDGET_MAX)),
});

/** POST /api/events/:token/claim */
export const claimSchema = z.object({
  participantId: z.string().check(z.minLength(1), z.maxLength(64)),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type ClaimInput = z.infer<typeof claimSchema>;
