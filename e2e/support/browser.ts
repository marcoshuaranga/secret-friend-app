import {
  type Browser,
  type BrowserContext,
  chromium,
  devices,
  type Locator,
  type Page,
} from "playwright";
import { baseUrl, chromiumPath } from "./env.ts";

let shared: Promise<Browser> | undefined;

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

/** One browser per test file; every person in a scenario gets an isolated context (a phone). */
export const browser = (): Promise<Browser> => {
  shared ??= chromium.launch(chromiumPath ? { executablePath: chromiumPath } : {});
  return shared;
};

export const closeBrowser = async (): Promise<void> => {
  if (shared) await (await shared).close();
  shared = undefined;
};

/**
 * Records what the app asks of the device (vibration, share sheet) and every state the
 * roulette goes through, so scenarios can assert on them without real hardware.
 */
const instrumentation = `(() => {
  const e2e = { vibrations: [], shares: [], rouletteStates: [] };
  Object.defineProperty(window, "__e2e", { value: e2e });
  Object.defineProperty(Navigator.prototype, "vibrate", {
    configurable: true, writable: true,
    value: function (pattern) { e2e.vibrations.push(pattern); return true; },
  });
  Object.defineProperty(Navigator.prototype, "share", {
    configurable: true, writable: true,
    value: async function (data) { e2e.shares.push(JSON.parse(JSON.stringify(data))); },
  });
  Object.defineProperty(Navigator.prototype, "canShare", {
    configurable: true, writable: true, value: () => true,
  });
  new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target;
      if (target instanceof Element && target.getAttribute("data-testid") === "roulette")
        e2e.rouletteStates.push(target.getAttribute("data-state"));
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
})();`;

export type Capability = "share" | "vibrate";

const removal = (capability: Capability): string =>
  capability === "share"
    ? "delete Navigator.prototype.share; delete Navigator.prototype.canShare;"
    : "delete Navigator.prototype.vibrate;";

export interface DeviceOptions {
  readonly without?: readonly Capability[];
  readonly headers?: Readonly<Record<string, string>>;
}

export interface Device {
  readonly context: BrowserContext;
  readonly page: Page;
  /** Bodies of every `/api/*` response this device received. */
  readonly responses: () => Promise<readonly unknown[]>;
  readonly errors: readonly Error[];
}

export const newDevice = async (options: DeviceOptions = {}): Promise<Device> => {
  const context = await (await browser()).newContext({
    ...devices["Pixel 7"],
    baseURL: baseUrl,
    locale: "es-ES",
    permissions: ["clipboard-read", "clipboard-write"],
    ...(options.headers ? { extraHTTPHeaders: { ...options.headers } } : {}),
  });
  await context.addInitScript(instrumentation);
  for (const capability of options.without ?? []) await context.addInitScript(removal(capability));
  const page = await context.newPage();

  const pending: Promise<unknown>[] = [];
  page.on("response", (response) => {
    if (new URL(response.url()).pathname.startsWith("/api/"))
      pending.push(response.text().then(parseJson, () => null));
  });
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));

  return { context, page, responses: () => Promise.all(pending), errors };
};

/** Removes a capability from an already loaded page and from every later navigation. */
export const removeCapability = async (device: Device, capability: Capability): Promise<void> => {
  await device.context.addInitScript(removal(capability));
  await device.page.evaluate(removal(capability));
};

export type Direction = "up" | "down" | "left" | "right";

const vectors: Readonly<Record<Direction, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** A real touch swipe (Chrome DevTools Protocol), as a finger would do it on a phone. */
export const swipe = async (page: Page, target: Locator, direction: Direction): Promise<void> => {
  const box = await target.boundingBox();
  if (!box) throw new Error("swipe target is not visible");
  const [dx, dy] = vectors[direction];
  const distance = 160;
  const from = {
    x: box.x + box.width / 2 - (dx * distance) / 2,
    y: box.y + box.height / 2 - (dy * distance) / 2,
  };
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", step: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints:
        type === "touchEnd"
          ? []
          : [{ x: from.x + (dx * distance * step) / 10, y: from.y + (dy * distance * step) / 10 }],
    });
  await touch("touchStart", 0);
  for (let step = 1; step <= 10; step++) await touch("touchMove", step);
  await touch("touchEnd", 10);
  await cdp.detach();
};

interface Recorded {
  readonly vibrations: readonly unknown[];
  readonly shares: readonly { readonly url?: string }[];
  readonly rouletteStates: readonly (string | null)[];
}

export const recorded = (page: Page): Promise<Recorded> =>
  page.evaluate(() => (window as unknown as { __e2e: Recorded }).__e2e);
