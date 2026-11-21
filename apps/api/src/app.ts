import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import * as schema from "./db/schema.ts";
import type { Deps } from "./deps.ts";
import { readDevice } from "./device.ts";
import type { AppEnv } from "./env.ts";
import { fail } from "./http.ts";
import { crearRepo } from "./repo.ts";
import { adminRoutes } from "./routes/admin.ts";
import { eventRoutes } from "./routes/events.ts";
import { meRoutes } from "./routes/me.ts";

/** La app Hono con sus efectos inyectados (`createApp(deps)`), para producción y pruebas. */
export const createApp = (deps: Deps) =>
  new Hono<AppEnv>()
    .basePath("/api")
    .use(async (c, next) => {
      c.set("deps", deps);
      c.set("repo", crearRepo(drizzle(c.env.DB, { schema })));
      await next();
      c.header("Cache-Control", "no-store");
    })
    .use(readDevice)
    .get("/health", (c) => c.json({ ok: true }))
    .route("/events", eventRoutes)
    .route("/events", adminRoutes)
    .route("/", meRoutes)
    .notFound((c) => fail(c, "NOT_FOUND"));
