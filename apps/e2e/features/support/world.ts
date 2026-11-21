import { After, AfterAll, BeforeAll, setWorldConstructor, World } from "@cucumber/cucumber";
import { type Browser, type BrowserContext, chromium, devices, type Page } from "playwright";
import { BASE_URL } from "./server.ts";

let browser: Browser | undefined;

BeforeAll(async () => {
  // En local puede usarse un Chromium ya instalado; en CI, el que instala Playwright.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  browser = await chromium.launch(executablePath ? { executablePath } : {});
});

AfterAll(async () => {
  await browser?.close();
});

/** Cada persona usa su propio "teléfono": un contexto de navegador aislado. */
export class UiWorld extends World {
  readonly phones = new Map<string, BrowserContext>();
  readonly pages = new Map<string, Page>();
  eventLink = "";
  firstReceiver = "";

  async page(person: string): Promise<Page> {
    const existing = this.pages.get(person);
    if (existing) return existing;
    if (!browser) throw new Error("Chromium no disponible");
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: BASE_URL });
    const page = await context.newPage();
    this.phones.set(person, context);
    this.pages.set(person, page);
    return page;
  }
}

setWorldConstructor(UiWorld);

After(async function (this: UiWorld) {
  for (const context of this.phones.values()) await context.close();
});
