import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as a from "../../support/actions.ts";
import { ids } from "../../support/contract.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/reveal_result.feature");

/** `"20 USD"` → `20 USD`; `no value` / `nothing about it` → absent. */
const optional = (cell: unknown): string | undefined => {
  const match = /^"(.*)"$/.exec(String(cell));
  return match?.[1];
};

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  ScenarioOutline(
    "The result shows the exchange details that exist",
    ({ Given, When, Then, And }, { date, budget, shown_date, shown_budget }) => {
      Given('the event "Navidad 2026" has <date> as exchange date and <budget> as budget', () => {
        const exchangeDate = optional(date);
        const suggestedBudget = optional(budget);
        return a.givenEvent({
          name: "Navidad 2026",
          participants: ["Ana", "Beto", "Carla", "Diego"],
          ...(exchangeDate === undefined ? {} : { date: exchangeDate }),
          ...(suggestedBudget === undefined ? {} : { budget: suggestedBudget }),
        });
      });
      And('Ana has claimed the name "Ana"', () => a.claimViaUi("Ana", "Ana"));
      When("Ana reveals the secret friend", async () => {
        await a.spin("Ana");
      });
      Then("Ana sees the secret friend's name", async () => {
        await a.expectRevealedFriendOf("Ana");
        expect(world().revealed.at(-1)).toBe(await a.fetchSecretFriend("Ana"));
      });
      And("Ana sees the exchange date <shown_date>", () =>
        a.expectDetail("Ana", ids.exchangeDate, optional(shown_date)),
      );
      And("Ana sees the budget <shown_budget>", () =>
        a.expectDetail("Ana", ids.budget, optional(shown_budget)),
      );
    },
  );

  Scenario("Revisiting the link shows the result straight away", () => {});
});
