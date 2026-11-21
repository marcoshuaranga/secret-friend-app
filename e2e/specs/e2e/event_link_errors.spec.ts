import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import * as a from "../../support/actions.ts";
import { pages } from "../../support/contract.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/event_link_errors.feature");

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  ScenarioOutline("An invalid link shows an error page", ({ When, Then }, { token }) => {
    When('a visitor opens the event link with token "<token>"', async () => {
      const { page } = await world().device("visitor");
      await page.goto(pages.event(String(token)));
    });
    Then('the visitor sees the "invalid_link" error page', () =>
      a.expectErrorPage("visitor", "invalid_link"),
    );
  });

  Scenario("A link without a token shows an error page", ({ When, Then }) => {
    When("a visitor opens the event page without a token", async () => {
      const { page } = await world().device("visitor");
      await page.goto(pages.eventWithoutToken);
    });
    Then('the visitor sees the "invalid_link" error page', () =>
      a.expectErrorPage("visitor", "invalid_link"),
    );
  });

  Scenario("The API does not find an unknown event", ({ When }) => {
    When("anyone requests the public event data with an unknown token", async () => {
      const w = world();
      w.response = await (await w.api()).getEvent("does-not-exist-0000000000000000000000");
    });
  });

  ScenarioOutline(
    "An event expires 90 days after it is created",
    ({ Given, When, Then }, { age, outcome }) => {
      Given("an event created <age> days ago", async () => {
        await a.givenEvent({ name: "Navidad 2026", participants: ["Ana", "Beto", "Carla"] });
        world().travelDays(Number(age));
      });
      When("a visitor opens the event link", async () => {
        await a.openEventLink("visitor");
      });
      Then("the visitor sees <outcome>", async () => {
        const { page } = await world().device("visitor");
        if (outcome === "the participant list")
          await a.testId(page, a.ids.participantList).waitFor();
        else await a.expectErrorPage("visitor", "expired_link");
      });
    },
  );

  Scenario("A new visitor is told when every name is already taken", ({ When, Then }) => {
    When("a visitor opens the event link on a new device", async () => {
      await a.openEventLink("visitor");
    });
    Then('the visitor sees the "all_names_taken" error page', () =>
      a.expectErrorPage("visitor", "all_names_taken"),
    );
  });
});
