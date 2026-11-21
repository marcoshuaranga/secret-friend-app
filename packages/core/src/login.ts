const HOUR_MS = 60 * 60 * 1000;

export const MAX_FAILED_LOGINS = 5;
export const LOGIN_WINDOW_MS = HOUR_MS;

/** Intentos fallidos de contraseña de un evento dentro de la ventana actual. */
export interface LoginThrottle {
  readonly failedLogins: number;
  readonly windowStart: number | null;
}

const windowExpired = (now: number, state: LoginThrottle): boolean =>
  state.windowStart === null || now - state.windowStart >= LOGIN_WINDOW_MS;

/** El estado vigente: si la ventana venció, se reinicia. */
const current = (now: number, state: LoginThrottle): LoginThrottle =>
  windowExpired(now, state) ? { failedLogins: 0, windowStart: null } : state;

/** ¿Se permite intentar ahora? (RF-21: 5 fallos por hora). */
export const canAttemptLogin =
  (now: number) =>
  (state: LoginThrottle): boolean =>
    current(now, state).failedLogins < MAX_FAILED_LOGINS;

/** Estado tras un intento fallido. */
export const registerFailedLogin =
  (now: number) =>
  (state: LoginThrottle): LoginThrottle => {
    const base = current(now, state);
    return { failedLogins: base.failedLogins + 1, windowStart: base.windowStart ?? now };
  };

export const resetLogins: LoginThrottle = { failedLogins: 0, windowStart: null };
