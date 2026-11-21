import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { buildReel, seededRandomInt } from "../../src/index.ts";

interface ReelWorld {
  others: readonly string[];
  result: string;
  reel: readonly string[];
}

Given(
  "que Ana ve la ruleta con los demás participantes {string} y su resultado es {string}",
  function (this: ReelWorld, list: string, result: string) {
    this.others = list.split(",").map((name) => name.trim());
    this.result = result;
  },
);

When("se genera la tira con la semilla {int}", function (this: ReelWorld, seed: number) {
  this.reel = buildReel(seededRandomInt(seed))(this.result, this.others);
});

Then("la tira termina en {string}", function (this: ReelWorld, name: string) {
  assert.equal(this.reel.at(-1), name);
});

Then("la tira no contiene {string}", function (this: ReelWorld, name: string) {
  assert.equal(this.reel.includes(name), false);
});

Then("la tira nunca repite un nombre seguido", function (this: ReelWorld) {
  this.reel.forEach((name, i) => {
    assert.notEqual(name, this.reel[i - 1], `repetido en la posición ${i}`);
  });
});

Then("{string} aparece poco antes del final", function (this: ReelWorld, name: string) {
  assert.ok(this.reel.slice(-8, -1).includes(name));
});
