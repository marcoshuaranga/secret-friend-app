import { type EventSummary, eventTokenSchema, parseWith } from "@secret-friend/contract";
import type { Context } from "hono";
import type { AppEnv } from "../env.ts";
import type { EventRow } from "../repo.ts";

const parseToken = parseWith(eventTokenSchema);

/** Evento vigente del parámetro `:token`, o `undefined` si no existe, venció o es inválido. */
export const loadEvent = async <E extends AppEnv>(c: Context<E>): Promise<EventRow | undefined> => {
  const token = parseToken(c.req.param("token"));
  return token.ok ? c.var.repo.findEventByToken(token.value, c.var.deps.now()) : undefined;
};

export const summary = (event: EventSummary): EventSummary => ({
  id: event.id,
  token: event.token,
  name: event.name,
  date: event.date,
  budget: event.budget,
});
