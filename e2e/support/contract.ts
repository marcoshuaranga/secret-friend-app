/**
 * The contract between the e2e suite and the app. The app must implement exactly this;
 * if the app changes, change it here and nowhere else.
 */

export const api = {
  health: "/api/health",
  /** POST { name, participants, date?, budget? } → 201 { token, adminKey } | 400 { error } */
  events: "/api/events",
  /** GET → 200 { name, date, budget, participants: [{ name, taken }] } | 404 | 410 { error } */
  event: (token: string) => `/api/events/${encodeURIComponent(token)}`,
  /** POST { name } → 201 { deviceToken } | 409 { error: "name_taken" } */
  claim: (token: string) => `/api/events/${encodeURIComponent(token)}/claim`,
  /** GET with `Authorization: Bearer <deviceToken>` → 200 { giver, receiver } | 401 */
  result: (token: string) => `/api/events/${encodeURIComponent(token)}/result`,
  /** POST { name } with `Authorization: Bearer <adminKey>` → 204 | 401 */
  release: (token: string) => `/api/events/${encodeURIComponent(token)}/release`,
} as const;

/**
 * Test clock: only when the Worker runs with `E2E=true`, it takes "now" (epoch ms) from this
 * header instead of the real clock. Lets scenarios check expiration without waiting 90 days.
 */
export const clockHeader = "x-e2e-now";

export const pages = {
  create: "/",
  event: (token: string) => `/e?t=${encodeURIComponent(token)}`,
  eventWithoutToken: "/e",
  admin: (token: string) => `/admin?t=${encodeURIComponent(token)}`,
} as const;

/** `data-testid` hooks. Elements with state expose it in `data-state` / `data-name` / `data-error`. */
export const ids = {
  // Create event
  eventName: "event-name",
  participantName: "participant-name",
  addParticipant: "add-participant",
  eventDate: "event-date",
  eventBudget: "event-budget",
  createEvent: "create-event",
  formError: "form-error", // data-error=<code>
  // Event created
  eventLink: "event-link", // text is the absolute event URL
  adminKey: "admin-key",
  copyLink: "copy-link",
  shareLink: "share-link",
  copyFeedback: "copy-feedback",
  // Event page
  participantList: "participant-list",
  participant: "participant", // data-name, data-state=available|taken, disabled when taken
  confirmIdentity: "confirm-identity", // data-name
  confirmYes: "confirm-yes",
  confirmNo: "confirm-no",
  currentIdentity: "current-identity",
  roulette: "roulette", // data-state=idle|spinning|stopped
  rouletteItem: "roulette-item",
  spinButton: "spin-button",
  replayButton: "replay-button",
  secretFriend: "secret-friend", // data-highlighted=true when revealed
  confetti: "confetti",
  exchangeDate: "exchange-date", // only rendered when the event has a date
  budget: "budget", // only rendered when the event has a budget
  errorPage: "error-page", // data-error=invalid_link|expired_link|all_names_taken
  // Admin page
  adminKeyInput: "admin-key-input",
  adminUnlock: "admin-unlock",
  releaseName: "release-name", // data-name
} as const;
