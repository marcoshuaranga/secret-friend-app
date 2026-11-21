import type {
  AdminView,
  ApiError,
  ApiErrorCode,
  ClaimResult,
  CreatedEvent,
  CreateEventInput,
  DrawResult,
  MyEvents,
  PublicEvent,
  RecoveryCandidate,
  UpdateEventInput,
} from "@secret-friend/contract";
import { err, ok, type Result } from "@secret-friend/core";

export type ClientError = Pick<ApiError, "issues"> & { readonly error: ApiErrorCode | "NETWORK" };
export type ApiResult<T> = Result<T, ClientError>;

const request = async <T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> => {
  try {
    const init: RequestInit = { method, credentials: "same-origin" };
    if (body !== undefined) {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const response = await fetch(`/api${path}`, init);
    if (response.status === 204) return ok(undefined as T);
    const data: unknown = await response.json();
    return response.ok ? ok(data as T) : err(data as ClientError);
  } catch {
    return err({ error: "NETWORK" });
  }
};

const event = (token: string) => `/events/${encodeURIComponent(token)}`;

/** Cliente tipado de la API (mismos tipos que el Worker, desde `@secret-friend/contract`). */
export const api = {
  createEvent: (input: CreateEventInput) => request<CreatedEvent>("POST", "/events", input),
  getEvent: (token: string) => request<PublicEvent>("GET", event(token)),
  claim: (token: string, participantId: string, fingerprint?: string) =>
    request<ClaimResult>("POST", `${event(token)}/claim`, { participantId, fingerprint }),
  result: (token: string) => request<DrawResult>("GET", `${event(token)}/result`),
  myEvents: () => request<MyEvents>("GET", "/me/events"),
  recovery: (fingerprint: string) =>
    request<readonly RecoveryCandidate[]>("POST", "/recovery", { fingerprint }),
  login: (eventId: string, password: string, fingerprint?: string) =>
    request<CreatedEvent>("POST", "/admin/login", { eventId, password, fingerprint }),
  admin: (token: string) => request<AdminView>("GET", `${event(token)}/admin`),
  release: (token: string, participantId: string) =>
    request<void>("DELETE", `${event(token)}/participants/${participantId}/claim`),
  updateEvent: (token: string, changes: UpdateEventInput) =>
    request<void>("PATCH", event(token), changes),
  deleteEvent: (token: string) => request<void>("DELETE", event(token)),
};
