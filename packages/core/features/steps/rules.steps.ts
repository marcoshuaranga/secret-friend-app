import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import {
  type ClaimDecision,
  type ClaimError,
  type ClaimState,
  canAttemptLogin,
  decideClaim,
  expiresAt,
  hasUniqueNames,
  isExpired,
  type LoginThrottle,
  type Result,
  registerFailedLogin,
  resetLogins,
} from "../../src/index.ts";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const START = Date.UTC(2026, 11, 1);

interface RulesWorld {
  names: readonly string[];
  claimState: ClaimState;
  claim?: Result<ClaimDecision, ClaimError>;
  throttle: LoginThrottle;
  lastAttemptAt: number;
  createdAt: number;
}

Given("los nombres {string}", function (this: RulesWorld, list: string) {
  this.names = list.split(",").map((name) => name.trim());
});

Then("los nombres son únicos", function (this: RulesWorld) {
  assert.equal(hasUniqueNames(this.names), true);
});

Then("los nombres no son únicos", function (this: RulesWorld) {
  assert.equal(hasUniqueNames(this.names), false);
});

Given("un nombre libre y un dispositivo sin nombre en el evento", function (this: RulesWorld) {
  this.claimState = { ownerDeviceId: null, deviceParticipantId: null };
});

Given("un nombre tomado por el mismo dispositivo", function (this: RulesWorld) {
  this.claimState = { ownerDeviceId: "yo", deviceParticipantId: "p1" };
});

Given("un nombre tomado por otro dispositivo", function (this: RulesWorld) {
  this.claimState = { ownerDeviceId: "otro", deviceParticipantId: null };
});

Given(
  "un nombre libre y un dispositivo que ya tiene otro nombre en el evento",
  function (this: RulesWorld) {
    this.claimState = { ownerDeviceId: null, deviceParticipantId: "p2" };
  },
);

When("el dispositivo intenta tomar el nombre", function (this: RulesWorld) {
  this.claim = decideClaim("yo", "p1")(this.claimState);
});

Then("puede tomarlo", function (this: RulesWorld) {
  assert.deepEqual(this.claim, { ok: true, value: "claim" });
});

Then("ya es suyo", function (this: RulesWorld) {
  assert.deepEqual(this.claim, { ok: true, value: "already_mine" });
});

Then("falla con {string}", function (this: RulesWorld, error: string) {
  assert.deepEqual(this.claim, { ok: false, error });
});

Given("un evento sin intentos fallidos", function (this: RulesWorld) {
  this.throttle = resetLogins;
});

When(
  "se registran {int} intentos fallidos en {int} minutos",
  function (this: RulesWorld, attempts: number, minutes: number) {
    const times = Array.from(
      { length: attempts },
      (_, i) => START + Math.floor((i * minutes * MINUTE) / attempts),
    );
    this.throttle = times.reduce((state, at) => registerFailedLogin(at)(state), this.throttle);
    this.lastAttemptAt = times.at(-1) ?? START;
  },
);

Then("no se permite intentar de nuevo", function (this: RulesWorld) {
  assert.equal(canAttemptLogin(this.lastAttemptAt + MINUTE)(this.throttle), false);
});

Then("se permite intentar", function (this: RulesWorld) {
  assert.equal(canAttemptLogin(this.lastAttemptAt + MINUTE)(this.throttle), true);
});

Then("una hora después del primer fallo se permite intentar", function (this: RulesWorld) {
  assert.equal(canAttemptLogin(START + 60 * MINUTE)(this.throttle), true);
});

Given("un evento creado hoy", function (this: RulesWorld) {
  this.createdAt = START;
});

Then("sigue vigente a los {int} días", function (this: RulesWorld, days: number) {
  assert.equal(isExpired(this.createdAt + days * DAY)(expiresAt(this.createdAt)), false);
});

Then("vence a los {int} días", function (this: RulesWorld, days: number) {
  assert.equal(isExpired(this.createdAt + days * DAY)(expiresAt(this.createdAt)), true);
});
