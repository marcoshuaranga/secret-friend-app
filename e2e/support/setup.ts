import { afterAll, beforeAll } from "vitest";
import { closeBrowser } from "./browser.ts";
import { api } from "./contract.ts";
import { baseUrl } from "./env.ts";
import "./steps.ts";

beforeAll(async () => {
  const health = await fetch(new URL(api.health, baseUrl), {
    signal: AbortSignal.timeout(5_000),
  }).catch((error: unknown) => error);
  if (!(health instanceof Response) || !health.ok)
    throw new Error(
      `The app is not reachable at ${baseUrl}. Build it and start the Worker with E2E=true ` +
        "(e.g. `wrangler dev`), or point E2E_BASE_URL at a running deploy.",
    );
});

afterAll(closeBrowser);
