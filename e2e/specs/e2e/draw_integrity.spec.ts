import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as a from "../../support/actions.ts";
import { resetWorld, world } from "../../support/world.ts";

const feature = await loadFeature("features/draw_integrity.feature");

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  ScenarioOutline(
    "Nobody draws themselves and everyone gives and receives exactly one gift",
    ({ Given, When, Then, And }, { count }) => {
      Given("an event with <count> participants", () =>
        a.givenEvent({ name: "Navidad 2026", participants: a.participantNames(Number(count)) }),
      );
      When("every participant claims their name and reveals their secret friend", async () => {
        for (const name of world().currentEvent.participants) {
          expect((await a.claimViaApi(name, name)).status).toBe(201);
          world().secretFriends.set(name, await a.fetchSecretFriend(name));
        }
      });
      Then("no participant drew their own name", () => {
        for (const [giver, receiver] of world().secretFriends) expect(receiver).not.toBe(giver);
      });
      And("every participant is the secret friend of exactly one other participant", () => {
        const { participants } = world().currentEvent;
        expect([...world().secretFriends.keys()].toSorted()).toEqual(participants.toSorted());
        expect([...world().secretFriends.values()].toSorted()).toEqual(participants.toSorted());
      });
    },
  );

  Scenario("The draw is fixed when the event is created", () => {});
});
