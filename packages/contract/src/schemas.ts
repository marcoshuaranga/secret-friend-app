import { hasUniqueNames, MAX_PARTICIPANTS, MIN_PARTICIPANTS } from "@secret-friend/core";
import * as z from "zod/mini";

export const EVENT_NAME_MAX = 80;
export const PARTICIPANT_NAME_MAX = 60;
export const BUDGET_MAX = 40;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Texto recortado, no vacío y con largo máximo. */
const text = (max: number) => z.string().check(z.trim(), z.minLength(1), z.maxLength(max));

const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD"));

/** Identificadores y tokens aleatorios: seguros para URL. */
const opaqueId = z.string().check(z.regex(/^[A-Za-z0-9_-]{16,64}$/));

/** Token público de un evento: aleatorio, largo y seguro para URL. */
export const eventTokenSchema = z.string().check(z.regex(/^[A-Za-z0-9_-]{22,64}$/));

const password = z
  .string()
  .check(
    z.minLength(PASSWORD_MIN, `La contraseña necesita al menos ${PASSWORD_MIN} caracteres`),
    z.maxLength(PASSWORD_MAX),
  );

/** Huella del navegador reducida con SHA-256 (hex). Solo es una pista, nunca autoriza. */
const fingerprint = z.string().check(z.regex(/^[a-f0-9]{64}$/));

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
  password,
  fingerprint: z.optional(fingerprint),
});

/** POST /api/events/:token/claim */
export const claimSchema = z.object({
  participantId: opaqueId,
  fingerprint: z.optional(fingerprint),
});

/** POST /api/admin/login */
export const loginSchema = z.object({
  eventId: opaqueId,
  password: z.string().check(z.minLength(1), z.maxLength(PASSWORD_MAX)),
  fingerprint: z.optional(fingerprint),
});

/** POST /api/recovery */
export const recoverySchema = z.object({ fingerprint });

/** PATCH /api/events/:token — `null` borra la fecha o el presupuesto. */
export const updateEventSchema = z.object({
  name: z.optional(text(EVENT_NAME_MAX)),
  date: z.optional(z.nullable(isoDate)),
  budget: z.optional(z.nullable(text(BUDGET_MAX))),
});

export const participantIdSchema = opaqueId;

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type ClaimInput = z.infer<typeof claimSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RecoveryInput = z.infer<typeof recoverySchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
