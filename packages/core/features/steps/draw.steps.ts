import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import {
  type Assignment,
  type DrawError,
  draw,
  type Result,
  seededRandomInt,
} from "../../src/index.ts";

type DrawResult = Result<readonly Assignment[], DrawError>;

interface DrawWorld {
  participants: readonly string[];
  result?: DrawResult;
  second?: DrawResult;
  samples: readonly DrawResult[];
}

const names = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, i) => `P${i + 1}`);

const value = (result: DrawResult | undefined): readonly Assignment[] => {
  assert.ok(result?.ok, "se esperaba un sorteo válido");
  return result.value;
};

Given("un grupo de {int} participantes", function (this: DrawWorld, count: number) {
  this.participants = names(count);
});

Given("los participantes {string}", function (this: DrawWorld, list: string) {
  this.participants = list.split(",").map((name) => name.trim());
});

When("se realiza el sorteo", function (this: DrawWorld) {
  this.result = draw(seededRandomInt(42))(this.participants);
});

When("se realiza el sorteo dos veces con la misma semilla", function (this: DrawWorld) {
  this.result = draw(seededRandomInt(7))(this.participants);
  this.second = draw(seededRandomInt(7))(this.participants);
});

When("se realizan {int} sorteos con semillas distintas", function (this: DrawWorld, runs: number) {
  this.samples = Array.from({ length: runs }, (_, seed) =>
    draw(seededRandomInt(seed + 1))(this.participants),
  );
});

Then("el sorteo es válido", function (this: DrawWorld) {
  assert.equal(this.result?.ok, true);
});

Then("ningún participante se toca a sí mismo", function (this: DrawWorld) {
  for (const { giver, receiver } of value(this.result)) assert.notEqual(giver, receiver);
});

Then("cada participante regala a una persona y recibe de otra", function (this: DrawWorld) {
  const assignments = value(this.result);
  assert.deepEqual(
    assignments.map((a) => a.giver),
    this.participants,
  );
  assert.deepEqual([...assignments.map((a) => a.receiver)].sort(), [...this.participants].sort());
});

Then("ambos sorteos son idénticos", function (this: DrawWorld) {
  assert.deepEqual(this.result, this.second);
});

Then("aparecen los {int} repartos posibles", function (this: DrawWorld, expected: number) {
  assert.equal(countByOutcome(this.samples).size, expected);
});

Then("cada reparto aparece cerca de {int} veces", function (this: DrawWorld, expected: number) {
  for (const count of countByOutcome(this.samples).values()) {
    assert.ok(
      Math.abs(count - expected) <= expected * 0.15,
      `reparto con ${count} apariciones, se esperaban ~${expected}`,
    );
  }
});

Then("el sorteo falla con el error {string}", function (this: DrawWorld, kind: string) {
  assert.ok(this.result && !this.result.ok, "se esperaba un error");
  assert.equal(this.result.error.kind, kind);
});

const countByOutcome = (samples: readonly DrawResult[]): ReadonlyMap<string, number> =>
  samples.reduce((acc, result) => {
    const key = value(result)
      .map((a) => `${a.giver}>${a.receiver}`)
      .join(",");
    return new Map(acc).set(key, (acc.get(key) ?? 0) + 1);
  }, new Map<string, number>());
