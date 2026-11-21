import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as a from "../../support/actions.ts";
import { assignmentsIn, field, parseJson } from "../../support/json.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/privacy.feature");

const otherAssignments = (values: readonly unknown[], owner: string) =>
  values.flatMap(assignmentsIn).filter((assignment) => assignment.giver !== owner);

/** A real device token from another event, valid there but not here. */
const tokenFromAnotherEvent = async (): Promise<string> => {
  const w = world();
  const here = w.currentEvent;
  await a.givenEvent({ name: "Otro evento", participants: ["Eva", "Fede", "Gabi"] });
  await a.claimViaApi("Eva", "Eva");
  w.event = here;
  return a.deviceToken("Eva");
};

const credentialsFor = async (credentials: string): Promise<string | undefined> => {
  if (credentials === "without a device token") return undefined;
  if (credentials === "with a device token from another event") return tokenFromAnotherEvent();
  await a.claimViaApi("Ana", "Ana");
  const real = a.deviceToken("Ana");
  return `${real.slice(0, -1)}${real.endsWith("A") ? "B" : "A"}`;
};

describeFeature(feature, ({ Background, Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  Background(() => {});

  Scenario("Public event data contains no assignments", ({ When, Then, But }) => {
    When("anyone requests the public event data", async () => {
      const w = world();
      w.response = await (await w.api()).getEvent(w.currentEvent.token);
    });
    Then("the response includes the event name, participants and which names are taken", () => {
      const { body, status } = world().response ?? {};
      expect(status).toBe(200);
      expect(field(body, "name")).toBe("Navidad 2026");
      expect(field(body, "participants")).toEqual(
        world().currentEvent.participants.map((name) => ({ name, taken: false })),
      );
    });
    But("the response includes no assignment", () => {
      const body = world().response?.body;
      expect(assignmentsIn(body)).toEqual([]);
      expect(JSON.stringify(body)).not.toMatch(/receiver|assignment/i);
    });
  });

  ScenarioOutline(
    "The result is denied without a valid device token",
    ({ When, Then }, { credentials }) => {
      When("someone requests the result <credentials>", async () => {
        const w = world();
        const token = await credentialsFor(String(credentials));
        w.response = await (await w.api()).result(w.currentEvent.token, token);
      });
      Then('the request is denied as "unauthorized"', () => {
        expect(world().response?.status).toBe(401);
        expect(field(world().response?.body, "error")).toBe("unauthorized");
      });
    },
  );

  Scenario("A device token only reveals its own assignment", ({ When }) => {
    When("Ana requests the result with the device token of Ana", async () => {
      const w = world();
      w.response = await (await w.api()).result(w.currentEvent.token, a.deviceToken("Ana"));
    });
  });

  Scenario("The admin key does not reveal any assignment", () => {});

  Scenario("Nothing on the device exposes other assignments", ({ Then, And }) => {
    Then(
      "no network response received by the device of Ana contains another participant's assignment",
      async () => {
        const responses = await (await world().device("Ana")).responses();
        expect(responses.length).toBeGreaterThan(0);
        expect(otherAssignments(responses, "Ana")).toEqual([]);
      },
    );
    And(
      "no data stored on the device of Ana contains another participant's assignment",
      async () => {
        const { context, page } = await world().device("Ana");
        const stored = await page.evaluate(() =>
          [localStorage, sessionStorage].flatMap((storage) =>
            Object.keys(storage).map((key) => storage.getItem(key) ?? ""),
          ),
        );
        const cookies = (await context.cookies()).map((cookie) => decodeURIComponent(cookie.value));
        expect(otherAssignments([...stored, ...cookies].map(parseJson), "Ana")).toEqual([]);
      },
    );
  });
});
