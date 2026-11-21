import { type APIRequestContext, request } from "playwright";
import { type ApiClient, type ApiResponse, apiClient } from "./api.ts";
import { type Capability, type Device, newDevice } from "./browser.ts";
import { clockHeader, pages } from "./contract.ts";
import { baseUrl } from "./env.ts";
import { text } from "./json.ts";

export interface CreatedEvent {
  readonly token: string;
  readonly adminKey: string;
  readonly participants: readonly string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Everything a single scenario knows. A fresh world is created for every scenario. */
export class World {
  readonly #devices = new Map<string, Device>();
  readonly #capabilities = new Map<string, readonly Capability[]>();
  #http: APIRequestContext | undefined;
  #nowOffsetDays: number | undefined;

  event: CreatedEvent | undefined;
  /** Every event created in the scenario, in order. */
  readonly events: CreatedEvent[] = [];
  /** Last create-event response (from the API or captured from the browser). */
  creation: ApiResponse | undefined;
  /** Last response of an API call made directly by a step. */
  response: ApiResponse | undefined;
  readonly responses: ApiResponse[] = [];
  readonly deviceTokens = new Map<string, string>();
  readonly secretFriends = new Map<string, string>();
  readonly revealed: string[] = [];
  lastSpinMs: number | undefined;

  get currentEvent(): CreatedEvent {
    if (!this.event) throw new Error("no event was created in this scenario");
    return this.event;
  }

  get link(): string {
    return new URL(pages.event(this.currentEvent.token), baseUrl).href;
  }

  /** Moves the test clock: requests behave as if made `days` days from now. */
  travelDays(days: number): void {
    this.#nowOffsetDays = days;
  }

  clockHeaders(): Readonly<Record<string, string>> {
    return this.#nowOffsetDays === undefined
      ? {}
      : { [clockHeader]: String(Date.now() + this.#nowOffsetDays * DAY_MS) };
  }

  async api(): Promise<ApiClient> {
    this.#http ??= await request.newContext({ baseURL: baseUrl });
    return apiClient(this.#http, () => this.clockHeaders());
  }

  /** Must be called before the person's device is first used. */
  withoutCapability(person: string, capability: Capability): void {
    this.#capabilities.set(person, [...(this.#capabilities.get(person) ?? []), capability]);
  }

  async device(person: string): Promise<Device> {
    const existing = this.#devices.get(person);
    if (existing) return existing;
    const created = await newDevice({
      without: this.#capabilities.get(person) ?? [],
      headers: this.clockHeaders(),
    });
    this.#devices.set(person, created);
    return created;
  }

  /** The person picks up a different phone: no storage shared with the previous one. */
  async newDeviceFor(person: string): Promise<Device> {
    await this.#devices.get(person)?.context.close();
    this.#devices.delete(person);
    return this.device(person);
  }

  remember(event: ApiResponse, participants: readonly string[]): CreatedEvent {
    const created = {
      token: text(event.body, "token"),
      adminKey: text(event.body, "adminKey"),
      participants,
    };
    this.event = created;
    this.events.push(created);
    return created;
  }

  async dispose(): Promise<void> {
    await Promise.all([...this.#devices.values()].map((device) => device.context.close()));
    await this.#http?.dispose();
  }
}

let current = new World();

export const world = (): World => current;

export const resetWorld = async (): Promise<void> => {
  await current.dispose();
  current = new World();
};
