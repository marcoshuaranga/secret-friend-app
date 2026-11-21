import {
  getVitestCucumberConfiguration,
  setVitestCucumberConfiguration,
} from "@amiceli/vitest-cucumber";
import { afterAll, beforeAll } from "vitest";
import { closeBrowser } from "./browser.ts";
import { baseUrl } from "./env.ts";

/** `@wip`: defined in Gherkin, steps not implemented yet. */
setVitestCucumberConfiguration({ ...getVitestCucumberConfiguration(), excludeTags: ["wip"] });

beforeAll(async () => {
  const health = await fetch(new URL("/api/health", baseUrl), {
    signal: AbortSignal.timeout(5_000),
  }).catch((error: unknown) => error);
  if (!(health instanceof Response) || !health.ok)
    throw new Error(
      `The app is not reachable at ${baseUrl}. Start the Worker (e.g. \`wrangler dev\`) ` +
        "or point E2E_BASE_URL at a running deploy.",
    );
});

afterAll(closeBrowser);
