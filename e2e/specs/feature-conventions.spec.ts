import { readdir } from "node:fs/promises";
import { loadFeature } from "@amiceli/vitest-cucumber";
import { describe, expect, test } from "vitest";

/**
 * Guards the conventions every feature file must follow before step definitions exist:
 * it parses with Gherkin, every scenario traces back to the PRD and runs on exactly one layer.
 */
const featuresDir = new URL("../features/", import.meta.url);
const files = (await readdir(featuresDir)).filter((file) => file.endsWith(".feature")).toSorted();

const REQUIREMENT = /^(RF-\d+|privacy|a11y|assumption)$/;
const LAYERS = ["ui", "api"] as const;

interface ScenarioInfo {
  readonly title: string;
  readonly tags: ReadonlySet<string>;
}

const scenariosOf = async (file: string): Promise<readonly ScenarioInfo[]> => {
  const feature = await loadFeature(new URL(file, featuresDir).pathname);
  const parents = [feature, ...feature.rules];
  return parents.flatMap((parent) =>
    parent.scenarii.map((scenario) => ({
      title: scenario.description,
      tags: new Set([
        ...feature.tags,
        ...(parent === feature ? [] : parent.tags),
        ...scenario.tags,
      ]),
    })),
  );
};

test("there are feature files", () => {
  expect(files.length).toBeGreaterThan(0);
});

describe.each(files)("%s", async (file) => {
  const scenarios = await scenariosOf(file);

  test("has scenarios with unique titles", () => {
    const titles = scenarios.map((s) => s.title);
    expect(titles.length).toBeGreaterThan(0);
    expect(new Set(titles).size).toBe(titles.length);
  });

  test.each(scenarios)("$title traces to a requirement", ({ tags }) => {
    expect([...tags].some((tag) => REQUIREMENT.test(tag))).toBe(true);
  });

  test.each(scenarios)("$title runs on exactly one layer (@ui or @api)", ({ tags }) => {
    expect(LAYERS.filter((layer) => tags.has(layer))).toHaveLength(1);
  });
});
