const DAY_MS = 24 * 60 * 60 * 1000;

/** Días que vive un evento antes de borrarse. */
export const EVENT_TTL_DAYS = 90;

export const expiresAt = (createdAt: number): number => createdAt + EVENT_TTL_DAYS * DAY_MS;

export const isExpired =
  (now: number) =>
  (expiry: number): boolean =>
    now >= expiry;
