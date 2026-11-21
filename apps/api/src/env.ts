import type { D1Database } from "@cloudflare/workers-types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./db/schema.ts";
import type { Deps } from "./deps.ts";
import type { Repo } from "./repo.ts";

export interface Bindings {
  readonly DB: D1Database;
}

export type Db = DrizzleD1Database<typeof schema>;

export interface CurrentDevice {
  readonly id: string;
  readonly fingerprint: string | null;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    readonly repo: Repo;
    readonly deps: Deps;
    /** Dispositivo identificado por la cookie, si la trae y es válida. */
    readonly device: CurrentDevice | null;
  };
}
