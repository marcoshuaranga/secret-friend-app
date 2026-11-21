import { drizzle } from "drizzle-orm/d1";
import { createApp } from "./app.ts";
import * as schema from "./db/schema.ts";
import { productionDeps } from "./deps.ts";
import type { Bindings } from "./env.ts";
import { crearRepo } from "./repo.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const ORPHAN_DEVICE_DAYS = 90;

const app = createApp(productionDeps);

export default {
  fetch: app.fetch,
  /** Cron diario: borra eventos vencidos y dispositivos sin eventos (fase 6.4). */
  scheduled: async (_controller, env, ctx) => {
    const now = productionDeps.now();
    ctx.waitUntil(
      crearRepo(drizzle(env.DB, { schema })).cleanup(now, now - ORPHAN_DEVICE_DAYS * DAY_MS),
    );
  },
} satisfies ExportedHandler<Bindings>;
