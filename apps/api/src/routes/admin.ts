import {
  type AdminView,
  parseWith,
  participantIdSchema,
  updateEventSchema,
} from "@secret-friend/contract";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env.ts";
import { fail, readJson } from "../http.ts";
import type { EventRow } from "../repo.ts";
import { loadEvent, summary } from "./shared.ts";

type AdminEnv = AppEnv & { Variables: AppEnv["Variables"] & { readonly event: EventRow } };

const parseUpdate = parseWith(updateEventSchema);
const parseParticipantId = parseWith(participantIdSchema);

/** Solo dispositivos registrados como admin del evento (RF-16). */
const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const event = await loadEvent(c);
  if (!event) return fail(c, "NOT_FOUND");
  const { device, repo } = c.var;
  if (!device || !(await repo.isAdmin(event.id, device.id))) return fail(c, "UNAUTHORIZED");
  c.set("event", event);
  await next();
});

export const adminRoutes = new Hono<AdminEnv>()
  /** RF-17: estado de cada participante, nunca las asignaciones. */
  .get("/:token/admin", requireAdmin, async (c) => {
    const { event, repo } = c.var;
    const list = await repo.listParticipants(event.id);
    return c.json<AdminView>({
      ...summary(event),
      expiresAt: event.expiresAt,
      participants: list.map((p) => ({
        id: p.id,
        name: p.name,
        claimed: p.deviceId !== null,
        revealed: p.revealedAt !== null,
      })),
    });
  })

  /** RF-18: liberar un nombre. */
  .delete("/:token/participants/:id/claim", requireAdmin, async (c) => {
    const id = parseParticipantId(c.req.param("id"));
    if (!id.ok) return fail(c, "NOT_FOUND");
    const released = await c.var.repo.releaseParticipant(c.var.event.id, id.value);
    return released ? c.body(null, 204) : fail(c, "NOT_FOUND");
  })

  /** RF-19: editar nombre, fecha y presupuesto. */
  .patch("/:token", requireAdmin, async (c) => {
    const input = parseUpdate(await readJson(c));
    if (!input.ok) return fail(c, "INVALID_INPUT", input.error);
    const changes = Object.fromEntries(
      Object.entries(input.value).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(changes).length > 0) await c.var.repo.updateEvent(c.var.event.id, changes);
    return c.body(null, 204);
  })

  /** RF-19: eliminar el evento con todo lo suyo. */
  .delete("/:token", requireAdmin, async (c) => {
    await c.var.repo.deleteEvent(c.var.event.id);
    return c.body(null, 204);
  });
