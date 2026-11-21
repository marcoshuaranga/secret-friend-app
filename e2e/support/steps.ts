import { defineSteps } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as a from "./actions.ts";
import { recorded } from "./browser.ts";
import { ids } from "./contract.ts";
import { assignmentsIn, field } from "./json.ts";
import { world } from "./world.ts";

/**
 * Steps shared by several features. Scenario Outline steps with `<placeholders>` cannot be
 * shared (vitest-cucumber limitation), so each spec defines them locally with these actions.
 */
type Keyword = "Given" | "When" | "Then" | "And" | "But";
type Register = (text: string, fn: (ctx: unknown, ...params: never[]) => unknown) => void;

defineSteps((keywords) => {
  const step = <P extends unknown[]>(text: string, fn: (...params: P) => unknown): void => {
    for (const keyword of ["Given", "When", "Then", "And", "But"] satisfies Keyword[])
      (keywords[keyword] as Register)(text, (_ctx, ...params) => fn(...(params as unknown as P)));
  };

  // ---------- Events ----------
  step("an event with participants {string}", (list: string) =>
    a.givenEvent({ name: "Navidad 2026", participants: a.names(list) }),
  );
  step("the organizer is on the create event page", () => a.openCreatePage());
  step(
    "the organizer creates the event {string} with participants {string}",
    (name: string, list: string) => a.createEventViaUi({ name, participants: a.names(list) }),
  );
  step(
    "the organizer creates the event {string} with:",
    (name: string, rows: readonly Record<string, string>[]) => {
      const row = rows[0];
      if (!row) throw new Error("expected one data row");
      return a.createEventViaUi({
        name,
        participants: a.names(row.participants ?? ""),
        ...(row.date ? { date: row.date } : {}),
        ...(row.budget ? { budget: row.budget } : {}),
      });
    },
  );
  step(
    "the organizer has just created the event {string} with participants {string}",
    async (name: string, list: string) => {
      await a.openCreatePage();
      await a.createEventViaUi({ name, participants: a.names(list) });
      a.expectEventCreated();
    },
  );
  step("the organizer creates an event with {int} participants", (count: number) =>
    a.createEventWithCount(count),
  );
  step(
    "the organizer creates two events named {string} with participants {string}",
    async (name: string, list: string) => {
      await a.givenEvent({ name, participants: a.names(list) });
      await a.givenEvent({ name, participants: a.names(list) });
    },
  );
  step("the event is created", () => a.expectEventCreated());
  step("the organizer sees the event link", async () => {
    const { page } = await world().device("organizer");
    expect((await a.testId(page, ids.eventLink).innerText()).trim()).toBe(world().link);
  });
  step("the organizer sees the admin key", async () => {
    const { page } = await world().device("organizer");
    expect((await a.testId(page, ids.adminKey).innerText()).trim()).toBe(
      world().currentEvent.adminKey,
    );
  });
  step(
    "anyone opening the event link sees the date {string} and the budget {string}",
    async (date: string, budget: string) => {
      await a.openEventLink("visitor");
      await a.expectDetail("visitor", ids.exchangeDate, date);
      await a.expectDetail("visitor", ids.budget, budget);
    },
  );
  step("each event has a different link", () => {
    const tokens = world().events.map((event) => event.token);
    expect(tokens).toHaveLength(2);
    expect(new Set(tokens).size).toBe(2);
  });
  step("the event link token carries at least {int} bits of randomness", (bits: number) => {
    const { token } = world().currentEvent;
    const bitsPerChar = /^[0-9a-f]+$/i.test(token) ? 4 : /^[A-Za-z0-9_-]+$/.test(token) ? 6 : 0;
    expect(bitsPerChar, "token must be hex or base64url").toBeGreaterThan(0);
    expect(token.length * bitsPerChar).toBeGreaterThanOrEqual(bits);
  });

  // ---------- Share ----------
  step("the organizer's device supports native sharing", () => undefined);
  step("the organizer's device does not support native sharing", () =>
    world().withoutCapability("organizer", "share"),
  );
  step("the organizer copies the event link", async () =>
    a.testId((await world().device("organizer")).page, ids.copyLink).click(),
  );
  step("the clipboard contains the event link", async () => {
    const { page } = await world().device("organizer");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(world().link);
  });
  step("the organizer is told the link was copied", async () =>
    a.testId((await world().device("organizer")).page, ids.copyFeedback).waitFor(),
  );
  step("the organizer shares the event link", async () =>
    a.testId((await world().device("organizer")).page, ids.shareLink).click(),
  );
  step("the device share menu opens with the event link", async () => {
    const { page } = await world().device("organizer");
    await expect
      .poll(async () => (await recorded(page)).shares.map((s) => s.url))
      .toEqual([world().link]);
  });
  step("the organizer looks at the created event", async () =>
    a.testId((await world().device("organizer")).page, ids.eventLink).waitFor(),
  );
  step("the organizer can copy the event link", async () =>
    a.testId((await world().device("organizer")).page, ids.copyLink).waitFor(),
  );
  step("the organizer is not offered the device share menu", async () =>
    expect(await a.testId((await world().device("organizer")).page, ids.shareLink).count()).toBe(0),
  );

  // ---------- Identity ----------
  step("{word} opens the event link", (person: string) => a.openEventLink(person));
  step("{word} has opened the event link", (person: string) => a.openEventLink(person));
  step("{word} reopens the event link on the same device", (person: string) =>
    a.openEventLink(person),
  );
  step("{word} opens the event link on a new device", async (person: string) => {
    await world().newDeviceFor(person);
    await a.openEventLink(person);
  });
  step("{word} sees the participants {string}", async (person: string, list: string) => {
    const { page } = await world().device(person);
    await a.testId(page, ids.participant).first().waitFor();
    const shown = await a
      .testId(page, ids.participant)
      .evaluateAll((items) => items.map((item) => item.getAttribute("data-name")));
    expect(shown).toEqual(a.names(list));
  });
  step("every participant is shown as available", async () => {
    for (const name of world().currentEvent.participants)
      await a.expectParticipantState("Ana", name, "available");
  });
  step("{word} picks {string} from the list", (person: string, name: string) =>
    a.pickName(person, name),
  );
  step("{word} has picked {string} from the list", (person: string, name: string) =>
    a.pickName(person, name),
  );
  step("{word} is asked to confirm being {string}", async (person: string, name: string) => {
    const dialog = a.testId((await world().device(person)).page, ids.confirmIdentity);
    await dialog.waitFor();
    expect(await dialog.getAttribute("data-name")).toBe(name);
  });
  step("{string} is still available", (name: string) => a.expectTakenOnServer(name, false));
  step("{word} confirms being {string}", (person: string) => a.confirmIdentity(person));
  step("{word} sees the roulette", async (person: string) => (await a.roulette(person)).waitFor());
  step("{string} is shown as taken to everyone else", (name: string) =>
    a.expectSeenByOthersAs(name, "taken"),
  );
  step("{word} cancels the confirmation", async (person: string) =>
    a.testId((await world().device(person)).page, ids.confirmNo).click(),
  );
  step("{word} is back on the participant list", async (person: string) => {
    const { page } = await world().device(person);
    await a.testId(page, ids.participantList).waitFor();
    await a.testId(page, ids.confirmIdentity).waitFor({ state: "hidden" });
  });
  step("{word} has claimed the name {string}", (person: string, name: string) =>
    a.claimViaUi(person, name),
  );
  step(
    "{word} has claimed the name {string} through the API",
    async (person: string, name: string) =>
      expect((await a.claimViaApi(person, name)).status).toBe(201),
  );
  step("{word} has claimed the name {string} by mistake", async (person: string, name: string) =>
    expect((await a.claimViaApi(person, name)).status).toBe(201),
  );
  step(
    "{word} has claimed the name {string} in the event {string}",
    async (person: string, name: string, event: string) => {
      await a.givenEvent({ name: event, participants: ["Ana", "Beto", "Carla", "Diego"] });
      await a.claimViaUi(person, name);
    },
  );
  step("{word} claims the name {string} through the API", (person: string, name: string) =>
    a.claimViaApi(person, name),
  );
  step("every participant has claimed their name", async () => {
    for (const name of world().currentEvent.participants)
      expect((await a.claimViaApi(name, name)).status).toBe(201);
  });
  step("{word} sees {string} marked as taken", (person: string, name: string) =>
    a.expectParticipantState(person, name, "taken"),
  );
  step("{word} cannot pick {string}", async (person: string, name: string) => {
    const { page } = await world().device(person);
    await page
      .locator(`[data-testid="${ids.participant}"][data-name="${name}"]`)
      .click({ force: true });
    expect(await a.testId(page, ids.confirmIdentity).isVisible()).toBe(false);
  });
  step("the claim is rejected as {string}", (code: string) => {
    expect(world().response?.status).toBe(409);
    expect(field(world().response?.body, "error")).toBe(code);
  });
  step("{word} is recognized as {string}", async (person: string, name: string) => {
    const identity = a.testId((await world().device(person)).page, ids.currentIdentity);
    await identity.waitFor();
    expect((await identity.innerText()).trim()).toBe(name);
  });
  step("{word} is not asked to pick a name", async (person: string) =>
    expect(await a.testId((await world().device(person)).page, ids.participantList).count()).toBe(
      0,
    ),
  );
  step("{word} sees the participant list", async (person: string) =>
    a.testId((await world().device(person)).page, ids.participantList).waitFor(),
  );
  step("{string} is shown as taken", (name: string) =>
    a.expectParticipantState("Ana", name, "taken"),
  );

  // ---------- Roulette and result ----------
  step("{word} swipes down on the roulette", (person: string) => a.spin(person, "down"));
  step("{word} presses the spin button", (person: string) => a.spin(person));
  step("{word} spins the roulette", (person: string) => a.spin(person));
  step("{word} reveals the secret friend", (person: string) => a.spin(person));
  step("{word} has revealed the secret friend", (person: string) => a.spin(person));
  step("the roulette spins", () => a.expectSpun("Ana"));
  step("the roulette reveals a secret friend", () => a.expectRevealedFriendOf("Ana"));
  step("the roulette only shows the names {string}", async (list: string) =>
    expect(await a.rouletteNames("Ana")).toEqual(new Set(a.names(list))),
  );
  step("the roulette stops on the secret friend the server assigned to {word}", (person: string) =>
    a.expectRevealedMatchesServer(person),
  );
  step("{word} replays the reveal animation", (person: string) => a.replay(person));
  step("the roulette stops on the same secret friend", () =>
    expect(new Set(world().revealed).size).toBe(1),
  );
  step("the secret friend's name is highlighted", () => a.expectHighlighted("Ana"));
  step("confetti is shown", () => a.expectConfetti("Ana", true));
  step("no confetti is shown", () => a.expectConfetti("Ana", false));
  step("the secret friend is revealed without a long spin", () =>
    expect(world().lastSpinMs).toBeLessThanOrEqual(a.REDUCED_MOTION_MAX_MS),
  );
  step("{word} prefers reduced motion", async (person: string) =>
    (await world().device(person)).page.emulateMedia({ reducedMotion: "reduce" }),
  );
  step(
    "{word} sees the same secret friend without spinning the roulette",
    async (person: string) => {
      const { page } = await world().device(person);
      const friend = a.testId(page, ids.secretFriend);
      await friend.waitFor();
      expect((await friend.innerText()).trim()).toBe(world().revealed.at(-1));
      expect((await recorded(page)).rouletteStates).not.toContain("spinning");
    },
  );

  // ---------- API results ----------
  step("{word} has fetched the secret friend", async (person: string) =>
    world().secretFriends.set(person, await a.fetchSecretFriend(person)),
  );
  step("{word} fetches the secret friend again", async (person: string) => {
    world().revealed.push(await a.fetchSecretFriend(person));
  });
  step("{word} gets the same secret friend", (person: string) =>
    expect(world().revealed.at(-1)).toBe(world().secretFriends.get(person)),
  );
  step("the request is denied as {string}", (code: string) => {
    expect(world().response?.status).toBe(401);
    expect(field(world().response?.body, "error")).toBe(code);
  });
  step("the request fails as {string}", (code: string) => {
    expect(world().response?.status).toBe(404);
    expect(field(world().response?.body, "error")).toBe(code);
  });
  step("anyone requests the public event data", async () => {
    const w = world();
    w.response = await (await w.api()).getEvent(w.currentEvent.token);
  });
  step("the organizer requests the result with the admin key", async () => {
    const w = world();
    w.response = await (await w.api()).result(w.currentEvent.token, w.currentEvent.adminKey);
  });
  step("the response contains only the secret friend of {string}", (giver: string) => {
    const found = assignmentsIn(world().response?.body);
    expect(found).toHaveLength(1);
    expect(found[0]?.giver).toBe(giver);
  });
});
