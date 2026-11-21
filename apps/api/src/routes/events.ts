import {
  type ClaimResult,
  type CreatedEvent,
  claimSchema,
  createEventSchema,
  type DrawResult,
  type PublicEvent,
  parseWith,
} from "@secret-friend/contract";
import { decideClaim, draw, expiresAt } from "@secret-friend/core";
import { Hono } from "hono";
import { ensureDevice } from "../device.ts";
import type { AppEnv } from "../env.ts";
import { fail, readJson } from "../http.ts";
import { hashPassword } from "../lib/crypto.ts";
import { loadEvent, summary } from "./shared.ts";

const parseCreate = parseWith(createEventSchema);
const parseClaim = parseWith(claimSchema);

export const eventRoutes = new Hono<AppEnv>()
  /** RF-1, RF-2, RF-13, RF-16: crea el evento, sortea y deja al dispositivo como admin. */
  .post("/", async (c) => {
    const input = parseCreate(await readJson(c));
    if (!input.ok) return fail(c, "INVALID_INPUT", input.error);
    const { deps, repo } = c.var;
    const drawn = draw(deps.randomInt)(input.value.participants);
    if (!drawn.ok) return fail(c, "INVALID_INPUT");

    const deviceId = await ensureDevice(c, input.value.fingerprint);
    const now = deps.now();
    const salt = deps.randomToken(16);
    const event = {
      id: deps.randomToken(16),
      token: deps.randomToken(),
      name: input.value.name,
      date: input.value.date ?? null,
      budget: input.value.budget ?? null,
      adminPasswordHash: await hashPassword(deps.passwordIterations)(input.value.password, salt),
      adminPasswordSalt: salt,
      createdAt: now,
      expiresAt: expiresAt(now),
    };
    await repo.createEvent({
      event,
      participants: input.value.participants.map((name) => ({ id: deps.randomToken(16), name })),
      assignments: drawn.value,
      adminDeviceId: deviceId,
    });
    return c.json<CreatedEvent>({ id: event.id, token: event.token }, 201);
  })

  /** RF-4, RF-5: datos públicos; nunca asignaciones. */
  .get("/:token", async (c) => {
    const event = await loadEvent(c);
    if (!event) return fail(c, "NOT_FOUND");
    const { repo, device } = c.var;
    const list = await repo.listParticipants(event.id);
    const mine = device ? list.find((p) => p.deviceId === device.id) : undefined;
    return c.json<PublicEvent>({
      ...summary(event),
      participants: list.map((p) => ({ id: p.id, name: p.name, taken: p.deviceId !== null })),
      me: mine ? { participantId: mine.id, revealed: mine.revealedAt !== null } : null,
      isAdmin: device ? await repo.isAdmin(event.id, device.id) : false,
    });
  })

  /** RF-4, RF-5, RF-6: el dispositivo toma un nombre. */
  .post("/:token/claim", async (c) => {
    const event = await loadEvent(c);
    if (!event) return fail(c, "NOT_FOUND");
    const input = parseClaim(await readJson(c));
    if (!input.ok) return fail(c, "INVALID_INPUT", input.error);
    const { repo, deps } = c.var;
    const list = await repo.listParticipants(event.id);
    const target = list.find((p) => p.id === input.value.participantId);
    if (!target) return fail(c, "NOT_FOUND");

    const deviceId = await ensureDevice(c, input.value.fingerprint);
    const decision = decideClaim(
      deviceId,
      target.id,
    )({
      ownerDeviceId: target.deviceId,
      deviceParticipantId: list.find((p) => p.deviceId === deviceId)?.id ?? null,
    });
    if (!decision.ok)
      return fail(c, decision.error === "name_taken" ? "NAME_TAKEN" : "ALREADY_CLAIMED");
    if (
      decision.value === "claim" &&
      !(await repo.claimParticipant(target.id, deviceId, deps.now()))
    )
      return fail(c, "NAME_TAKEN");
    return c.json<ClaimResult>({ participantId: target.id });
  })

  /** RF-8, RF-9, RF-14: solo mi resultado; la primera consulta lo marca como visto. */
  .get("/:token/result", async (c) => {
    const event = await loadEvent(c);
    if (!event) return fail(c, "NOT_FOUND");
    const { repo, deps, device } = c.var;
    if (!device) return fail(c, "NOT_CLAIMED");
    const list = await repo.listParticipants(event.id);
    const mine = list.find((p) => p.deviceId === device.id);
    if (!mine) return fail(c, "NOT_CLAIMED");
    const receiver = await repo.receiverOf(event.id, mine.id);
    if (!receiver) return fail(c, "NOT_FOUND");
    if (mine.revealedAt === null) await repo.markRevealed(mine.id, deps.now());
    return c.json<DrawResult>({
      receiver,
      others: list.filter((p) => p.id !== mine.id).map((p) => p.name),
      alreadyRevealed: mine.revealedAt !== null,
    });
  });
