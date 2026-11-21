import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "./env.ts";
import { sha256 } from "./lib/crypto.ts";

export const DEVICE_COOKIE = "sf_device";
/** Máximo que permiten los navegadores para una cookie (400 días). */
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

/** Lee la cookie del dispositivo y deja su id (o `null`) en el contexto. */
export const readDevice: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, DEVICE_COOKIE);
  const device = token ? await c.var.repo.findDeviceByTokenHash(await sha256(token)) : undefined;
  c.set("device", device ? { id: device.id, fingerprint: device.fingerprint } : null);
  await next();
};

/**
 * Devuelve el dispositivo actual o crea uno nuevo y emite su cookie. Si llega una huella
 * distinta de la guardada, la actualiza: solo sirve como pista de recuperación.
 */
export const ensureDevice = async (c: Context<AppEnv>, fingerprint?: string): Promise<string> => {
  const { repo, deps } = c.var;
  const existing = c.var.device;
  if (existing) {
    if (fingerprint && fingerprint !== existing.fingerprint)
      await repo.updateFingerprint(existing.id, fingerprint);
    return existing.id;
  }
  const id = deps.randomToken(16);
  const token = deps.randomToken();
  await repo.insertDevice({
    id,
    tokenHash: await sha256(token),
    fingerprint: fingerprint ?? null,
    createdAt: deps.now(),
  });
  setCookie(c, DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: deps.secureCookies,
    sameSite: "Strict",
    path: "/api",
    maxAge: COOKIE_MAX_AGE,
  });
  c.set("device", { id, fingerprint: fingerprint ?? null });
  return id;
};
