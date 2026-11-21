import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { AfterAll, Before, BeforeAll, setWorldConstructor, World } from "@cucumber/cucumber";
import { seededRandomInt } from "@secret-friend/core";
import { getPlatformProxy } from "wrangler";
import { createApp } from "../../src/app.ts";
import type { Deps } from "../../src/deps.ts";
import type { Bindings } from "../../src/env.ts";
import { randomToken } from "../../src/lib/crypto.ts";

type Proxy = Awaited<ReturnType<typeof getPlatformProxy<Bindings>>>;

let proxy: Proxy | undefined;

const migrationsDir = new URL("../../migrations/", import.meta.url);

BeforeAll(async () => {
  proxy = await getPlatformProxy<Bindings>({ persist: false });
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(new URL(file, migrationsDir), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await proxy.env.DB.prepare(statement).run();
    }
  }
});

AfterAll(async () => {
  await proxy?.dispose();
});

const TABLES = ["assignments", "participants", "event_admins", "events", "devices"] as const;

Before(async () => {
  const db = proxy?.env.DB;
  if (!db) throw new Error("D1 local no disponible");
  await db.batch(TABLES.map((table) => db.prepare(`DELETE FROM ${table}`)));
});

export interface ApiResponse {
  readonly status: number;
  readonly body: unknown;
}

/** Un "dispositivo" es un tarro de cookies con nombre, como un navegador distinto. */
export class ApiWorld extends World {
  now = Date.UTC(2026, 11, 1, 12);
  readonly cookies = new Map<string, string>();
  readonly fingerprints = new Map<string, string>();
  readonly tokens = new Map<string, string>();
  readonly eventIds = new Map<string, string>();
  last: ApiResponse = { status: 0, body: undefined };
  firstReceiver: string | undefined;
  results: Map<string, string> | undefined;

  private readonly deps: Deps = {
    now: () => this.now,
    randomInt: seededRandomInt(2026),
    randomToken,
    passwordIterations: 1_000,
    secureCookies: false,
  };
  private readonly app = createApp(this.deps);

  /** Huella estable derivada de una etiqueta ("iPhone de Ana"). */
  fingerprintOf(label: string): string {
    return createHash("sha256").update(label).digest("hex");
  }

  /** Llama a la API y guarda la respuesta como `last`. */
  async call(device: string, method: string, path: string, body?: unknown): Promise<ApiResponse> {
    this.last = await this.peek(device, method, path, body);
    return this.last;
  }

  /** Llama a la API sin tocar `last` (para consultas auxiliares de los pasos). */
  async peek(device: string, method: string, path: string, body?: unknown): Promise<ApiResponse> {
    const env = proxy?.env;
    if (!env) throw new Error("D1 local no disponible");
    const headers = new Headers();
    const cookie = this.cookies.get(device);
    if (cookie) headers.set("cookie", cookie);
    if (body !== undefined) headers.set("content-type", "application/json");
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);
    const response = await this.app.request(`http://localhost${path}`, init, env);
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) this.cookies.set(device, setCookie.split(";")[0] ?? "");
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  }

  tokenOf(event: string): string {
    const token = this.tokens.get(event);
    if (!token) throw new Error(`evento desconocido: ${event}`);
    return token;
  }
}

setWorldConstructor(ApiWorld);
