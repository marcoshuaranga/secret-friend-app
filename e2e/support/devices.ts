import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  chromium,
  devices,
  request,
} from "playwright";
import { baseUrl, chromiumPath } from "./env.ts";

/** Each person in a scenario uses their own phone: an isolated browser context. */
export interface DeviceOptions {
  readonly reducedMotion?: boolean;
  readonly nativeShare?: boolean;
  readonly vibration?: boolean;
}

export const launchBrowser = (): Promise<Browser> =>
  chromium.launch(chromiumPath ? { executablePath: chromiumPath } : {});

const phone = devices["Pixel 7"];

const removeApi = (api: "share" | "vibrate"): string =>
  `Object.defineProperty(Navigator.prototype, ${JSON.stringify(api)}, { value: undefined });`;

export const newDevice =
  (browser: Browser) =>
  async (options: DeviceOptions = {}): Promise<BrowserContext> => {
    const context = await browser.newContext({
      ...phone,
      baseURL: baseUrl,
      locale: "es-ES",
      reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    if (options.nativeShare === false) await context.addInitScript(removeApi("share"));
    if (options.vibration === false) await context.addInitScript(removeApi("vibrate"));
    return context;
  };

/** HTTP client for `@api` scenarios: talks to the same deployed Worker as the browser. */
export const newApiClient = (): Promise<APIRequestContext> =>
  request.newContext({ baseURL: baseUrl });

/** Distinct names for scenarios that only care about the group size. */
export const participantNames = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, i) => `Participant ${i + 1}`);
