import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import type { Result } from "@secret-friend/core";
import {
  type CreateEventInput,
  createEventSchema,
  parseWith,
  type ValidationIssue,
} from "../../src/index.ts";

type Outcome = Result<CreateEventInput, readonly ValidationIssue[]>;

interface ContractWorld {
  input: { name: string; participants: string[]; date?: string; budget?: string };
  outcome?: Outcome;
}

const parseCreateEvent = parseWith(createEventSchema);
const split = (list: string): string[] => list.split(",");

Given(
  "un evento llamado {string} con los participantes {string}",
  function (this: ContractWorld, name: string, list: string) {
    this.input = { name, participants: split(list) };
  },
);

Given(
  "un evento llamado {string} con {int} participantes",
  function (this: ContractWorld, name: string, count: number) {
    this.input = { name, participants: Array.from({ length: count }, (_, i) => `P${i + 1}`) };
  },
);

Given(
  "la fecha {string} y el presupuesto {string}",
  function (this: ContractWorld, date: string, budget: string) {
    this.input = { ...this.input, date, budget };
  },
);

When("se valida la creación", function (this: ContractWorld) {
  this.outcome = parseCreateEvent(this.input);
});

When("se valida la creación de una entrada nula", function (this: ContractWorld) {
  this.outcome = parseCreateEvent(null);
});

const success = (outcome: Outcome | undefined): CreateEventInput => {
  assert.ok(outcome?.ok, `se esperaba una validación correcta: ${JSON.stringify(outcome)}`);
  return outcome.value;
};

Then("la validación es correcta", function (this: ContractWorld) {
  success(this.outcome);
});

Then("el evento se llama {string}", function (this: ContractWorld, name: string) {
  assert.equal(success(this.outcome).name, name);
});

Then("los participantes son {string}", function (this: ContractWorld, list: string) {
  assert.deepEqual(
    success(this.outcome).participants,
    list.split(",").map((n) => n.trim()),
  );
});

Then("la validación falla", function (this: ContractWorld) {
  assert.ok(this.outcome && !this.outcome.ok, "se esperaba un error");
});

Then("la validación falla en {string}", function (this: ContractWorld, path: string) {
  assert.ok(this.outcome && !this.outcome.ok, "se esperaba un error");
  assert.ok(
    this.outcome.error.some((issue) => issue.path === path),
    `sin error en "${path}"; rutas con error: ${this.outcome.error.map((i) => i.path).join(", ")}`,
  );
});
