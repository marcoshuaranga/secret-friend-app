import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import * as a from "../../support/actions.ts";
import { type Direction, removeCapability } from "../../support/browser.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/spin_roulette.feature");

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  Background(() => {});

  Rule(
    "Swiping down spins the roulette, and a button offers an accessible alternative",
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenario("Swipe down to spin", () => {});
      RuleScenario("Press the spin button instead of swiping", () => {});

      RuleScenarioOutline(
        "Other gestures do not spin the roulette",
        ({ When, Then }, { direction }) => {
          When("Ana swipes <direction> on the roulette", () =>
            a.swipeOnRoulette("Ana", String(direction) as Direction),
          );
          Then("the roulette does not spin", () => a.expectNotSpun("Ana"));
        },
      );
    },
  );

  Rule("The roulette is only visual and always lands on the drawn result", ({ RuleScenario }) => {
    RuleScenario("The roulette never shows my own name", () => {});
    RuleScenario("The roulette lands on the secret friend assigned by the server", () => {});
    RuleScenario("Replaying the roulette never changes the result", () => {});
  });

  Rule(
    "The reveal is festive, unless the participant prefers reduced motion",
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenarioOutline(
        "Celebrate the reveal",
        ({ Given, When, Then, And }, { vibration, vibrates }) => {
          Given("the phone <vibration> vibration", async () => {
            if (vibration === "does not support")
              await removeCapability(await world().device("Ana"), "vibrate");
          });
          When("Ana spins the roulette", async () => {
            await a.spin("Ana");
          });
          Then("the secret friend's name is highlighted", () => a.expectHighlighted("Ana"));
          And("confetti is shown", () => a.expectConfetti("Ana", true));
          And("the phone <vibrates>", () =>
            a.expectVibrations("Ana", vibrates === "vibrates briefly"),
          );
        },
      );

      RuleScenario("Reduced motion reveals the result without a long spin or confetti", () => {});
    },
  );
});
