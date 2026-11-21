import type { Page } from "playwright";
import { expect } from "vitest";
import type { ApiResponse, EventInput } from "./api.ts";
import { type Direction, recorded, swipe } from "./browser.ts";
import { api, ids, pages } from "./contract.ts";
import { baseUrl } from "./env.ts";
import { field, isObject, text } from "./json.ts";
import { world } from "./world.ts";

const ORGANIZER = "organizer";
/** Fast enough to tell "no long spin" apart from the normal animation. */
export const REDUCED_MOTION_MAX_MS = 1000;

export const names = (list: string): readonly string[] =>
  list.split(",").map((name) => name.trim());

export const participantNames = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, i) => `Participant ${i + 1}`);

const testId = (page: Page, id: string) => page.getByTestId(id);
const participantItem = (page: Page, name: string) =>
  page.locator(`[data-testid="${ids.participant}"][data-name="${name}"]`);

// ---------- Event creation ----------

export const createEventViaApi = async (input: EventInput): Promise<ApiResponse> => {
  const w = world();
  const response = await (await w.api()).createEvent(input);
  w.creation = response;
  if (response.status === 201) w.remember(response, input.participants);
  return response;
};

export const createEventWithCount = async (count: number): Promise<void> => {
  await createEventViaApi({ name: "Navidad 2026", participants: participantNames(count) });
};

export const givenEvent = async (input: EventInput): Promise<void> => {
  const response = await createEventViaApi(input);
  expect(response.status, JSON.stringify(response.body)).toBe(201);
};

export const openCreatePage = async (person = ORGANIZER): Promise<Page> => {
  const { page } = await world().device(person);
  await page.goto(pages.create);
  return page;
};

/** Fills the form like a person would and captures the request, if the app sends one. */
export const createEventViaUi = async (input: EventInput): Promise<void> => {
  const w = world();
  const { page } = await w.device(ORGANIZER);
  if (!page.url().startsWith(baseUrl)) await openCreatePage();

  await testId(page, ids.eventName).fill(input.name);
  for (const [index, name] of input.participants.entries()) {
    if ((await testId(page, ids.participantName).count()) <= index)
      await testId(page, ids.addParticipant).click();
    await testId(page, ids.participantName).nth(index).fill(name);
  }
  if (input.date !== undefined) await testId(page, ids.eventDate).fill(input.date);
  if (input.budget !== undefined) await testId(page, ids.eventBudget).fill(input.budget);

  const sent = page
    .waitForResponse(
      (r) => new URL(r.url()).pathname === api.events && r.request().method() === "POST",
      { timeout: 5_000 },
    )
    .catch(() => undefined);
  await testId(page, ids.createEvent).click();
  const response = await sent;
  w.creation = response
    ? { status: response.status(), body: await response.json().catch(() => null) }
    : undefined;
  if (w.creation?.status === 201) {
    w.remember(
      w.creation,
      input.participants.map((name) => name.trim()),
    );
    await testId(page, ids.eventLink).waitFor();
  }
};

export const expectEventCreated = (): void => {
  const { creation } = world();
  expect(creation?.status, JSON.stringify(creation?.body)).toBe(201);
  expect(text(creation?.body, "token")).not.toBe("");
};

export const expectEventNotCreated = async (layer: "ui" | "api"): Promise<void> => {
  const w = world();
  if (w.creation) expect(w.creation.status).toBe(400);
  if (layer === "ui")
    expect(await testId((await w.device(ORGANIZER)).page, ids.eventLink).count()).toBe(0);
};

export const expectUiError = async (code: string): Promise<void> => {
  const { page } = await world().device(ORGANIZER);
  await page.locator(`[data-testid="${ids.formError}"][data-error="${code}"]`).waitFor();
};

export const expectApiError = (code: string): void => {
  expect(field(world().creation?.body, "error")).toBe(code);
};

// ---------- Event page ----------

export const openEventLink = async (person: string): Promise<Page> => {
  const { page } = await world().device(person);
  await page.goto(pages.event(world().currentEvent.token));
  return page;
};

export const expectParticipantState = async (
  person: string,
  name: string,
  state: "available" | "taken",
): Promise<void> => {
  const { page } = await world().device(person);
  const item = participantItem(page, name);
  await item.waitFor();
  expect(await item.getAttribute("data-state")).toBe(state);
  if (state === "taken") expect(await item.isDisabled()).toBe(true);
};

/** Server truth, independent of what any device shows. */
export const expectTakenOnServer = async (name: string, taken: boolean): Promise<void> => {
  const w = world();
  const response = await (await w.api()).getEvent(w.currentEvent.token);
  const participants = field(response.body, "participants");
  const entry = Array.isArray(participants)
    ? participants.find((p) => isObject(p) && p.name === name)
    : undefined;
  expect(field(entry, "taken")).toBe(taken);
};

/** Someone who never claimed anything opens the link. */
export const expectSeenByOthersAs = async (name: string, state: "available" | "taken") => {
  const observer = `observer-${Date.now()}`;
  await openEventLink(observer);
  await expectParticipantState(observer, name, state);
};

export const pickName = async (person: string, name: string): Promise<void> => {
  const { page } = await world().device(person);
  await participantItem(page, name).click();
};

export const confirmIdentity = async (person: string): Promise<void> => {
  const w = world();
  const { page } = await w.device(person);
  const claimed = page.waitForResponse(
    (r) => r.url().includes("/claim") && r.request().method() === "POST",
  );
  await testId(page, ids.confirmYes).click();
  const response = await claimed;
  expect(response.status()).toBe(201);
  w.deviceTokens.set(person, text(await response.json(), "deviceToken"));
  await testId(page, ids.roulette).waitFor();
};

export const claimViaUi = async (person: string, name: string): Promise<void> => {
  await openEventLink(person);
  await pickName(person, name);
  await confirmIdentity(person);
};

export const claimViaApi = async (person: string, name: string): Promise<ApiResponse> => {
  const w = world();
  const response = await (await w.api()).claim(w.currentEvent.token, name);
  w.response = response;
  if (response.status === 201) w.deviceTokens.set(person, text(response.body, "deviceToken"));
  return response;
};

export const deviceToken = (person: string): string => {
  const token = world().deviceTokens.get(person);
  if (!token) throw new Error(`${person} has no device token`);
  return token;
};

export const fetchSecretFriend = async (person: string): Promise<string> => {
  const w = world();
  const response = await (await w.api()).result(w.currentEvent.token, deviceToken(person));
  expect(response.status, JSON.stringify(response.body)).toBe(200);
  return text(response.body, "receiver");
};

// ---------- Roulette ----------

export const roulette = async (person: string) =>
  testId((await world().device(person)).page, ids.roulette);

const waitForStop = async (page: Page): Promise<string> => {
  await page
    .locator(`[data-testid="${ids.roulette}"][data-state="stopped"]`)
    .waitFor({ timeout: 15_000 });
  const friend = testId(page, ids.secretFriend);
  await friend.waitFor();
  return (await friend.innerText()).trim();
};

export const spin = async (
  person: string,
  how: "button" | Direction = "button",
): Promise<string> => {
  const { page } = await world().device(person);
  const started = Date.now();
  if (how === "button") await testId(page, ids.spinButton).click();
  else await swipe(page, testId(page, ids.roulette), how);
  const friend = await waitForStop(page);
  world().lastSpinMs = Date.now() - started;
  world().revealed.push(friend);
  return friend;
};

export const expectSpun = async (person: string): Promise<void> => {
  const { page } = await world().device(person);
  expect((await recorded(page)).rouletteStates).toContain("spinning");
};

export const swipeOnRoulette = async (person: string, direction: Direction): Promise<void> => {
  const { page } = await world().device(person);
  await swipe(page, testId(page, ids.roulette), direction);
};

export const expectNotSpun = async (person: string): Promise<void> => {
  const { page } = await world().device(person);
  await page.waitForTimeout(1_000);
  expect((await recorded(page)).rouletteStates).not.toContain("spinning");
  expect(await testId(page, ids.secretFriend).isVisible()).toBe(false);
};

export const expectRevealedFriendOf = async (person: string): Promise<void> => {
  const friend = world().revealed.at(-1);
  expect(friend).toBeDefined();
  expect(world().currentEvent.participants).toContain(friend);
  expect(friend).not.toBe(person);
};

export const expectRevealedMatchesServer = async (person: string): Promise<void> => {
  expect(world().revealed.at(-1)).toBe(await fetchSecretFriend(person));
};

export const rouletteNames = async (person: string): Promise<ReadonlySet<string>> => {
  const { page } = await world().device(person);
  const texts = await testId(page, ids.rouletteItem).allInnerTexts();
  return new Set(texts.map((t) => t.trim()));
};

export const expectHighlighted = async (person: string): Promise<void> => {
  const { page } = await world().device(person);
  expect(await testId(page, ids.secretFriend).getAttribute("data-highlighted")).toBe("true");
};

export const expectConfetti = async (person: string, shown: boolean): Promise<void> => {
  const { page } = await world().device(person);
  if (shown) await testId(page, ids.confetti).waitFor();
  else {
    await page.waitForTimeout(500);
    expect(await testId(page, ids.confetti).count()).toBe(0);
  }
};

export const expectVibrations = async (person: string, brief: boolean): Promise<void> => {
  const device = await world().device(person);
  const { vibrations } = await recorded(device.page);
  expect(device.errors).toEqual([]);
  if (!brief) return expect(vibrations).toEqual([]);
  expect(vibrations).toHaveLength(1);
  const total = [vibrations[0]].flat().reduce<number>((sum, ms) => sum + Number(ms), 0);
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(400);
};

export const expectDetail = async (
  person: string,
  id: typeof ids.exchangeDate | typeof ids.budget,
  value: string | undefined,
): Promise<void> => {
  const { page } = await world().device(person);
  if (value === undefined) expect(await testId(page, id).count()).toBe(0);
  else expect(await testId(page, id).innerText()).toContain(value);
};

export const expectErrorPage = async (person: string, code: string): Promise<void> => {
  const { page } = await world().device(person);
  const error = testId(page, ids.errorPage);
  await error.waitFor();
  expect(await error.getAttribute("data-error")).toBe(code);
};

export { ids, testId };
