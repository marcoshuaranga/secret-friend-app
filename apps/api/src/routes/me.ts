import {
  type CreatedEvent,
  loginSchema,
  type MyEvents,
  parseWith,
  type RecoveryCandidate,
  recoverySchema,
} from "@secret-friend/contract";
import { canAttemptLogin, registerFailedLogin, resetLogins } from "@secret-friend/core";
import { Hono } from "hono";
import { ensureDevice } from "../device.ts";
import type { AppEnv } from "../env.ts";
import { fail, readJson } from "../http.ts";
import { hashPassword, safeEqual } from "../lib/crypto.ts";

const parseRecovery = parseWith(recoverySchema);
const parseLogin = parseWith(loginSchema);

export const meRoutes = new Hono<AppEnv>()
  /** RF-20: eventos creados y unidos desde este dispositivo. */
  .get("/me/events", async (c) => {
    const { repo, deps, device } = c.var;
    if (!device) return c.json<MyEvents>({ created: [], joined: [] });
    const now = deps.now();
    const [created, joined] = await Promise.all([
      repo.eventsAdministeredBy(device.id, now),
      repo.eventsJoinedBy(device.id, now),
    ]);
    return c.json<MyEvents>({ created, joined });
  })

  /** RF-21: pista por huella. Solo nombre y fecha: entrar exige la contraseña. */
  .post("/recovery", async (c) => {
    const input = parseRecovery(await readJson(c));
    if (!input.ok) return fail(c, "INVALID_INPUT", input.error);
    const { repo, deps } = c.var;
    const candidates = await repo.recoveryCandidates(input.value.fingerprint, deps.now());
    return c.json<readonly RecoveryCandidate[]>(candidates);
  })

  /** RF-21: la contraseña del organizador suma este dispositivo como admin. */
  .post("/admin/login", async (c) => {
    const input = parseLogin(await readJson(c));
    if (!input.ok) return fail(c, "INVALID_INPUT", input.error);
    const { repo, deps } = c.var;
    const now = deps.now();
    const event = await repo.findEventById(input.value.eventId, now);
    if (!event) return fail(c, "NOT_FOUND");

    const throttle = { failedLogins: event.failedLogins, windowStart: event.loginWindowStart };
    if (!canAttemptLogin(now)(throttle)) return fail(c, "TOO_MANY_ATTEMPTS");

    const hash = await hashPassword(deps.passwordIterations)(
      input.value.password,
      event.adminPasswordSalt,
    );
    if (!safeEqual(hash, event.adminPasswordHash)) {
      const next = registerFailedLogin(now)(throttle);
      await repo.saveLoginThrottle(event.id, next.failedLogins, next.windowStart);
      return fail(c, "UNAUTHORIZED");
    }
    if (event.failedLogins > 0)
      await repo.saveLoginThrottle(event.id, resetLogins.failedLogins, resetLogins.windowStart);
    const deviceId = await ensureDevice(c, input.value.fingerprint);
    await repo.addAdmin(event.id, deviceId);
    return c.json<CreatedEvent>({ id: event.id, token: event.token });
  });
