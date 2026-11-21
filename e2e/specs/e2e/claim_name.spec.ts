import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as a from "../../support/actions.ts";
import type { ApiResponse } from "../../support/api.ts";
import { field } from "../../support/json.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/claim_name.feature");

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  Background(() => {});

  Rule("Every participant picks their own name and confirms it", ({ RuleScenario }) => {
    RuleScenario("The list shows every participant as available", () => {});
    RuleScenario("Picking a name asks for confirmation", () => {});
    RuleScenario("Confirming the name claims it", () => {});
    RuleScenario("Cancelling the confirmation keeps the name available", () => {});
  });

  Rule("A claimed name cannot be taken from another device", ({ RuleScenario }) => {
    RuleScenario("A taken name cannot be picked", () => {});
    RuleScenario("The API rejects claiming a taken name", () => {});

    RuleScenario(
      "Only one of two simultaneous claims for the same name succeeds",
      ({ When, Then, And }) => {
        let claims: readonly ApiResponse[] = [];
        When('Ana and Beto claim the name "Carla" at the same time', async () => {
          claims = await Promise.all([
            a.claimViaApi("Ana", "Carla"),
            a.claimViaApi("Beto", "Carla"),
          ]);
        });
        Then("exactly one claim succeeds", () => {
          expect(claims.filter((claim) => claim.status === 201)).toHaveLength(1);
        });
        And('the other claim is rejected as "name_taken"', () => {
          const rejected = claims.filter((claim) => claim.status !== 201);
          expect(rejected.map((claim) => [claim.status, field(claim.body, "error")])).toEqual([
            [409, "name_taken"],
          ]);
          expect(world().deviceTokens.size).toBe(1);
        });
      },
    );
  });

  Rule("The device remembers who I am", ({ RuleScenario }) => {
    RuleScenario("Reopening the link on the same device keeps my identity", () => {});
    RuleScenario("A new device does not inherit a claimed identity", () => {});
  });
});
