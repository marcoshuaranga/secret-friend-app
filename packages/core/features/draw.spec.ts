import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  type Assignment,
  type DrawError,
  draw,
  type Result,
  seededRandomInt,
} from "../src/index.ts";

type DrawResult = Result<readonly Assignment[], DrawError>;

const feature = await loadFeature("features/draw.feature");

const names = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, i) => `P${i + 1}`);

const drawnAssignments = (result: DrawResult | undefined): readonly Assignment[] => {
  if (!result?.ok) throw new Error("expected a valid draw");
  return result.value;
};

const countByOutcome = (samples: readonly DrawResult[]): ReadonlyMap<string, number> =>
  samples.reduce((acc, result) => {
    const key = drawnAssignments(result)
      .map((a) => `${a.giver}>${a.receiver}`)
      .join(",");
    return new Map(acc).set(key, (acc.get(key) ?? 0) + 1);
  }, new Map<string, number>());

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  ScenarioOutline("Nobody draws themselves", ({ Given, When, Then, And }, variables) => {
    let participants: readonly string[] = [];
    let result: DrawResult | undefined;

    Given("a group of <count> participants", () => {
      participants = names(Number(variables.count));
    });
    When("the draw is made", () => {
      result = draw(seededRandomInt(42))(participants);
    });
    Then("the draw is valid", () => {
      expect(result?.ok).toBe(true);
    });
    And("no participant draws themselves", () => {
      for (const { giver, receiver } of drawnAssignments(result)) expect(receiver).not.toBe(giver);
    });
    And("every participant gives to one person and receives from another", () => {
      const assignments = drawnAssignments(result);
      expect(assignments.map((a) => a.giver)).toEqual(participants);
      expect(assignments.map((a) => a.receiver).toSorted()).toEqual(participants.toSorted());
    });
  });

  Scenario("The same seed always produces the same draw", ({ Given, When, Then }) => {
    let participants: readonly string[] = [];
    let first: DrawResult | undefined;
    let second: DrawResult | undefined;

    Given("a group of {int} participants", (_, count: number) => {
      participants = names(count);
    });
    When("the draw is made twice with the same seed", () => {
      first = draw(seededRandomInt(7))(participants);
      second = draw(seededRandomInt(7))(participants);
    });
    Then("both draws are identical", () => {
      expect(first).toEqual(second);
    });
  });

  Scenario("Every valid outcome is equally likely", ({ Given, When, Then, And }) => {
    let participants: readonly string[] = [];
    let samples: readonly DrawResult[] = [];

    Given("a group of {int} participants", (_, count: number) => {
      participants = names(count);
    });
    When("{int} draws are made with different seeds", (_, runs: number) => {
      samples = Array.from({ length: runs }, (_, seed) =>
        draw(seededRandomInt(seed + 1))(participants),
      );
    });
    Then("all {int} possible outcomes appear", (_, expected: number) => {
      expect(countByOutcome(samples).size).toBe(expected);
    });
    And("each outcome appears about {int} times", (_, expected: number) => {
      for (const count of countByOutcome(samples).values())
        expect(Math.abs(count - expected)).toBeLessThanOrEqual(expected * 0.15);
    });
  });

  ScenarioOutline("An invalid group size is rejected", ({ Given, When, Then }, variables) => {
    let participants: readonly string[] = [];
    let result: DrawResult | undefined;

    Given("a group of <count> participants", () => {
      participants = names(Number(variables.count));
    });
    When("the draw is made", () => {
      result = draw(seededRandomInt(42))(participants);
    });
    Then('the draw fails with the error "<error>"', () => {
      expect(result?.ok).toBe(false);
      if (result && !result.ok) expect(result.error.kind).toBe(variables.error);
    });
  });

  Scenario("Repeated names are rejected", ({ Given, When, Then }) => {
    let participants: readonly string[] = [];
    let result: DrawResult | undefined;

    Given("the participants {string}", (_, list: string) => {
      participants = list.split(",").map((name) => name.trim());
    });
    When("the draw is made", () => {
      result = draw(seededRandomInt(42))(participants);
    });
    Then("the draw fails with the error {string}", (_, kind: string) => {
      expect(result?.ok).toBe(false);
      if (result && !result.ok) expect(result.error.kind).toBe(kind);
    });
  });
});
