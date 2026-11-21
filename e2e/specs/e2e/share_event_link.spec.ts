import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { resetWorld } from "../../support/world.ts";

const feature = await loadFeature("features/share_event_link.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(resetWorld);

  Scenario("Copy the link to the clipboard", () => {});
  Scenario("Share through the device share menu when it is available", () => {});
  Scenario("Only copying is offered when native sharing is unavailable", () => {});
});
