import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import * as a from "../../support/actions.ts";
import { resetWorld } from "../../support/world.ts";

const feature = await loadFeature("features/create_event.feature");

describeFeature(feature, ({ Rule, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  Rule(
    "An event needs a name and between 3 and 50 unique participants",
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenario("Create an event with only the required data", () => {});
      RuleScenario("Create an event with an exchange date and a suggested budget", () => {});

      RuleScenarioOutline("Accept the participant count limits", ({ When, Then }, { count }) => {
        When("the organizer creates an event with <count> participants", () =>
          a.createEventWithCount(Number(count)),
        );
        Then("the event is created", () => a.expectEventCreated());
      });

      RuleScenarioOutline(
        "Reject an event with too few or too many participants",
        ({ When, Then, And }, { count, error }) => {
          When("the organizer creates an event with <count> participants", () =>
            a.createEventWithCount(Number(count)),
          );
          Then("the event is not created", () => a.expectEventNotCreated("api"));
          And('the organizer is told "<error>"', () => a.expectApiError(String(error)));
        },
      );

      RuleScenarioOutline(
        "Reject invalid event data",
        ({ Given, When, Then, And }, { event, participants, error }) => {
          Given("the organizer is on the create event page", async () => {
            await a.openCreatePage();
          });
          When('the organizer creates the event "<event>" with participants "<participants>"', () =>
            a.createEventViaUi({
              name: String(event),
              participants: String(participants).split(","),
            }),
          );
          Then("the event is not created", () => a.expectEventNotCreated("ui"));
          And('the organizer is told "<error>"', () => a.expectUiError(String(error)));
        },
      );
    },
  );

  Rule("Each event has its own unguessable link", ({ RuleScenario }) => {
    RuleScenario("Two identical events get different links", () => {});
    RuleScenario("The event link token is long and random", () => {});
  });
});
