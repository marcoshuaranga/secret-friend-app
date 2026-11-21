import { defineSteps, describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { Result } from "@secret-friend/core";
import { expect } from "vitest";
import {
  type CreateEventInput,
  createEventSchema,
  parseWith,
  type ValidationIssue,
} from "../src/index.ts";

type Outcome = Result<CreateEventInput, readonly ValidationIssue[]>;

interface Input {
  readonly name: string;
  readonly participants: readonly string[];
  readonly date?: string;
  readonly budget?: string;
}

const feature = await loadFeature("features/create_event.feature");
const parseCreateEvent = parseWith(createEventSchema);
const split = (list: string): readonly string[] => list.split(",");

let input: Input | null = null;
let outcome: Outcome | undefined;

const success = (): CreateEventInput => {
  if (!outcome?.ok) throw new Error(`expected a valid input: ${JSON.stringify(outcome)}`);
  return outcome.value;
};

const failure = (): readonly ValidationIssue[] => {
  if (!outcome || outcome.ok) throw new Error("expected a validation error");
  return outcome.error;
};

const withCount = (count: number): Input => ({
  name: "Navidad",
  participants: Array.from({ length: count }, (_, i) => `P${i + 1}`),
});

defineSteps(({ Given, When, Then, And }) => {
  Given("an event named {string} with participants {string}", (_, name: string, list: string) => {
    input = { name, participants: split(list) };
  });
  And("the date {string} and the budget {string}", (_, date: string, budget: string) => {
    if (!input) throw new Error("no event input");
    input = { ...input, date, budget };
  });
  When("the input is validated", () => {
    outcome = parseCreateEvent(input);
  });
  When("a null input is validated", () => {
    outcome = parseCreateEvent(null);
  });
  Then("the input is valid", () => {
    success();
  });
  And("the event is named {string}", (_, name: string) => {
    expect(success().name).toBe(name);
  });
  And("the participants are {string}", (_, list: string) => {
    expect(success().participants).toEqual(list.split(",").map((n) => n.trim()));
  });
  Then("the input is invalid", () => {
    failure();
  });
  Then("the input is invalid at {string}", (_, path: string) => {
    expect(failure().map((issue) => issue.path)).toContain(path);
  });
});

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    input = null;
    outcome = undefined;
  });

  Scenario("A valid event is accepted", () => {});
  Scenario("Surrounding spaces are trimmed", () => {});
  Scenario("Date and budget are optional", () => {});

  ScenarioOutline(
    "An invalid number of participants is rejected",
    ({ Given, When, Then }, { count }) => {
      Given('an event named "Navidad" with <count> participants', () => {
        input = withCount(Number(count));
      });
      When("the input is validated", () => {
        outcome = parseCreateEvent(input);
      });
      Then('the input is invalid at "participants"', () => {
        expect(failure().map((issue) => issue.path)).toContain("participants");
      });
    },
  );

  Scenario("Repeated names are rejected regardless of letter case", () => {});
  Scenario("An empty participant name is rejected", () => {});
  Scenario("An event without a name is rejected", () => {});
  Scenario("A date in the wrong format is rejected", () => {});
  Scenario("An input that is not an object is rejected", () => {});
});
