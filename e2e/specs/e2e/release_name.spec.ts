import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as a from "../../support/actions.ts";
import { ids, pages } from "../../support/contract.ts";
import { field } from "../../support/json.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/release_name.feature");

const adminKeyFor = async (credentials: string): Promise<string | undefined> => {
  if (credentials === "without an admin key") return undefined;
  if (credentials === "with a wrong admin key") return `${world().currentEvent.adminKey}x`;
  const w = world();
  const here = w.currentEvent;
  await a.givenEvent({ name: "Otro evento", participants: ["Eva", "Fede", "Gabi"] });
  const otherKey = w.currentEvent.adminKey;
  w.event = here;
  return otherKey;
};

describeFeature(feature, ({ Background, Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  Background(() => {});

  Scenario("The organizer releases a claimed name with the admin key", ({ When, Then, And }) => {
    When('the organizer releases "Ana" from the organizer panel', async () => {
      const w = world();
      const { page } = await w.device("organizer");
      await page.goto(pages.admin(w.currentEvent.token));
      await a.testId(page, ids.adminKeyInput).fill(w.currentEvent.adminKey);
      await a.testId(page, ids.adminUnlock).click();
      await page.locator(`[data-testid="${ids.releaseName}"][data-name="Ana"]`).click();
      await expect
        .poll(async () => {
          const event = await (await w.api()).getEvent(w.currentEvent.token);
          return JSON.stringify(field(event.body, "participants"));
        })
        .toContain('{"name":"Ana","taken":false}');
    });
    Then('"Ana" is available again', () => a.expectSeenByOthersAs("Ana", "available"));
    And('Ana can claim the name "Ana"', () => a.claimViaUi("Ana", "Ana"));
  });

  Scenario("The previous device loses access after the release", ({ When, Then }) => {
    When('the organizer releases "Ana" with the admin key', async () => {
      const w = world();
      w.response = await (await w.api()).release(
        w.currentEvent.token,
        "Ana",
        w.currentEvent.adminKey,
      );
      expect(w.response.status).toBe(204);
    });
    Then("the device token of Beto no longer gets a result", async () => {
      const w = world();
      const result = await (await w.api()).result(w.currentEvent.token, a.deviceToken("Beto"));
      expect(result.status).toBe(401);
    });
  });

  Scenario(
    "The secret friend does not change after the name is released",
    ({ Given, When, Then }) => {
      Given('the secret friend assigned to "Ana" is known', async () => {
        world().secretFriends.set("Ana", await a.fetchSecretFriend("Beto"));
      });
      When('the organizer releases "Ana" with the admin key', async () => {
        const w = world();
        expect(
          (await (await w.api()).release(w.currentEvent.token, "Ana", w.currentEvent.adminKey))
            .status,
        ).toBe(204);
      });
      Then("Ana gets the same secret friend as before", async () => {
        expect(await a.fetchSecretFriend("Ana")).toBe(world().secretFriends.get("Ana"));
      });
    },
  );

  ScenarioOutline(
    "A name cannot be released without the right admin key",
    ({ When, Then, And }, { credentials }) => {
      When('someone releases "Ana" <credentials>', async () => {
        const w = world();
        const key = await adminKeyFor(String(credentials));
        w.response = await (await w.api()).release(w.currentEvent.token, "Ana", key);
      });
      Then('the request is denied as "unauthorized"', () => {
        expect(world().response?.status).toBe(401);
        expect(field(world().response?.body, "error")).toBe("unauthorized");
      });
      And('"Ana" is still taken', () => a.expectTakenOnServer("Ana", true));
    },
  );
});
