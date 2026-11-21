import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import type {
  AdminView,
  ApiError,
  CreatedEvent,
  DrawResult,
  MyEvents,
  PublicEvent,
  RecoveryCandidate,
} from "@secret-friend/contract";
import type { ApiWorld } from "../support/world.ts";

const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_PASSWORD = "secreto123";
const list = (names: string): string[] =>
  names
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

const bodyAs = <T>(world: ApiWorld): T => world.last.body as T;

const createEvent = async (
  world: ApiWorld,
  device: string,
  name: string,
  participants: string,
  extra: Record<string, unknown> = {},
) => {
  const response = await world.call(device, "POST", "/api/events", {
    name,
    participants: list(participants),
    password: DEFAULT_PASSWORD,
    ...extra,
  });
  if (response.status === 201) {
    const created = response.body as CreatedEvent;
    world.tokens.set(name, created.token);
    world.eventIds.set(name, created.id);
  }
  return response;
};

const publicEvent = async (world: ApiWorld, device: string, event: string) =>
  (await world.peek(device, "GET", `/api/events/${world.tokenOf(event)}`)).body as PublicEvent;

const participantId = async (world: ApiWorld, event: string, name: string): Promise<string> => {
  const found = (await publicEvent(world, "observador", event)).participants.find(
    (p) => p.name === name,
  );
  assert.ok(found, `no existe el participante ${name}`);
  return found.id;
};

const claim = async (world: ApiWorld, device: string, name: string, event: string) =>
  world.call(device, "POST", `/api/events/${world.tokenOf(event)}/claim`, {
    participantId: await participantId(world, event, name),
  });

const result = (world: ApiWorld, device: string, event: string) =>
  world.call(device, "GET", `/api/events/${world.tokenOf(event)}/result`);

const adminView = (world: ApiWorld, device: string, event: string) =>
  world.call(device, "GET", `/api/events/${world.tokenOf(event)}/admin`);

const login = (world: ApiWorld, device: string, event: string, password: string) =>
  world.call(device, "POST", "/api/admin/login", {
    eventId: world.eventIds.get(event),
    password,
  });

// --- Crear y abrir ----------------------------------------------------------------

When(
  "{string} crea el evento {string} con los participantes {string}",
  async function (this: ApiWorld, device: string, name: string, participants: string) {
    await createEvent(this, device, name, participants);
  },
);

Given(
  "que {string} creó el evento {string} con los participantes {string}",
  async function (this: ApiWorld, device: string, name: string, participants: string) {
    assert.equal((await createEvent(this, device, name, participants)).status, 201);
  },
);

Given(
  "que {string} creó desde {string} el evento {string} con la contraseña {string}",
  async function (this: ApiWorld, device: string, phone: string, name: string, password: string) {
    const response = await createEvent(this, device, name, "Ana, Beto, Carla", {
      password,
      fingerprint: this.fingerprintOf(phone),
    });
    assert.equal(response.status, 201);
  },
);

When(
  "{string} intenta crear el evento {string} con los participantes {string}",
  async function (this: ApiWorld, device: string, name: string, participants: string) {
    await createEvent(this, device, name, participants);
  },
);

When(
  "{string} intenta crear el evento {string} sin contraseña",
  async function (this: ApiWorld, device: string, name: string) {
    await this.call(device, "POST", "/api/events", { name, participants: ["A", "B", "C"] });
  },
);

When(
  "{string} abre el evento {string}",
  async function (this: ApiWorld, device: string, event: string) {
    await this.call(device, "GET", `/api/events/${this.tokenOf(event)}`);
  },
);

When(
  "{string} abre un evento con un enlace inventado",
  async function (this: ApiWorld, device: string) {
    await this.call(device, "GET", "/api/events/estoNoEsUnTokenRealDeNingunEvento");
  },
);

// --- Elegir nombre y resultado ----------------------------------------------------

When(
  "{string} elige el nombre {string} en {string}",
  async function (this: ApiWorld, device: string, name: string, event: string) {
    await claim(this, device, name, event);
  },
);

Given(
  "que {string} eligió el nombre {string} en {string}",
  async function (this: ApiWorld, device: string, name: string, event: string) {
    assert.equal((await claim(this, device, name, event)).status, 200);
  },
);

When(
  "{string} pide su resultado en {string}",
  async function (this: ApiWorld, device: string, event: string) {
    await result(this, device, event);
  },
);

Given(
  "que {string} ya vio su resultado en {string}",
  async function (this: ApiWorld, device: string, event: string) {
    const response = await result(this, device, event);
    assert.equal(response.status, 200);
    this.firstReceiver = (response.body as DrawResult).receiver;
  },
);

Given(
  "que cada participante eligió su nombre en {string} desde su dispositivo",
  async function (this: ApiWorld, event: string) {
    for (const p of (await publicEvent(this, "observador", event)).participants)
      assert.equal((await claim(this, `tel-${p.name}`, p.name, event)).status, 200);
  },
);

When(
  "cada participante pide su resultado en {string}",
  async function (this: ApiWorld, event: string) {
    const names = (await publicEvent(this, "observador", event)).participants.map((p) => p.name);
    this.results = new Map();
    for (const name of names) {
      const response = await this.peek(
        `tel-${name}`,
        "GET",
        `/api/events/${this.tokenOf(event)}/result`,
      );
      assert.equal(response.status, 200);
      this.results.set(name, (response.body as DrawResult).receiver);
    }
  },
);

// --- Mis eventos, panel y recuperación --------------------------------------------

When("{string} ve sus eventos", async function (this: ApiWorld, device: string) {
  await this.call(device, "GET", "/api/me/events");
});

When(
  "{string} abre el panel de {string}",
  async function (this: ApiWorld, device: string, event: string) {
    await adminView(this, device, event);
  },
);

When(
  "{string} libera el nombre {string} en {string}",
  async function (this: ApiWorld, device: string, name: string, event: string) {
    const id = await participantId(this, event, name);
    await this.call(
      device,
      "DELETE",
      `/api/events/${this.tokenOf(event)}/participants/${id}/claim`,
    );
  },
);

When(
  "{string} cambia el nombre de {string} a {string} con presupuesto {string}",
  async function (this: ApiWorld, device: string, event: string, name: string, budget: string) {
    await this.call(device, "PATCH", `/api/events/${this.tokenOf(event)}`, { name, budget });
  },
);

When("{string} elimina {string}", async function (this: ApiWorld, device: string, event: string) {
  await this.call(device, "DELETE", `/api/events/${this.tokenOf(event)}`);
});

When(
  "{string} pide recuperación con la huella de {string}",
  async function (this: ApiWorld, device: string, phone: string) {
    await this.call(device, "POST", "/api/recovery", { fingerprint: this.fingerprintOf(phone) });
  },
);

When(
  "{string} entra a {string} con la contraseña {string}",
  async function (this: ApiWorld, device: string, event: string, password: string) {
    await login(this, device, event, password);
  },
);

Given(
  "que {string} falló {int} veces la contraseña de {string}",
  async function (this: ApiWorld, device: string, times: number, event: string) {
    for (let i = 0; i < times; i++) {
      this.now += 60_000;
      assert.equal((await login(this, device, event, `mala-${i}-clave`)).status, 401);
    }
  },
);

Then(
  "una hora después {string} entra a {string} con la contraseña {string}",
  async function (this: ApiWorld, device: string, event: string, password: string) {
    this.now += 60 * 60 * 1000;
    await login(this, device, event, password);
  },
);

When("pasan {int} días", function (this: ApiWorld, days: number) {
  this.now += days * DAY;
});

// --- Comprobaciones ---------------------------------------------------------------

Then("la respuesta es {int}", function (this: ApiWorld, status: number) {
  assert.equal(this.last.status, status, JSON.stringify(this.last.body));
});

Then(
  "la respuesta es {int} con el error {string}",
  function (this: ApiWorld, status: number, error: string) {
    assert.equal(this.last.status, status, JSON.stringify(this.last.body));
    assert.equal(bodyAs<ApiError>(this).error, error);
  },
);

Then("el enlace del evento es largo e inadivinable", function (this: ApiWorld) {
  const { token } = bodyAs<CreatedEvent>(this);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
});

Then(
  "{string} es administradora de {string}",
  async function (this: ApiWorld, device: string, event: string) {
    const response = await this.peek(device, "GET", `/api/events/${this.tokenOf(event)}/admin`);
    assert.equal(response.status, 200);
    assert.equal((await publicEvent(this, device, event)).isAdmin, true);
  },
);

Then(
  "{string} no puede abrir el panel de {string}",
  async function (this: ApiWorld, device: string, event: string) {
    const response = await this.peek(device, "GET", `/api/events/${this.tokenOf(event)}/admin`);
    assert.equal(response.status, 401);
  },
);

Then("ve a los participantes {string} libres", function (this: ApiWorld, names: string) {
  const event = bodyAs<PublicEvent>(this);
  assert.deepEqual(
    event.participants.map((p) => p.name),
    list(names),
  );
  assert.ok(event.participants.every((p) => !p.taken));
});

Then("la respuesta no contiene asignaciones", function (this: ApiWorld) {
  const text = JSON.stringify(this.last.body);
  assert.ok(!/receiver|giver|assignment/i.test(text), text);
});

Then(
  "al abrir {string}, {string} aparece como {string}",
  async function (this: ApiWorld, event: string, device: string, name: string) {
    const view = await publicEvent(this, device, event);
    assert.equal(view.me?.participantId, await participantId(this, event, name));
  },
);

Then(
  "al abrir {string}, el nombre {string} figura como tomado",
  async function (this: ApiWorld, event: string, name: string) {
    const view = await publicEvent(this, "observador", event);
    assert.equal(view.participants.find((p) => p.name === name)?.taken, true);
  },
);

Then(
  "al abrir {string}, {string} figura con el resultado visto",
  async function (this: ApiWorld, event: string, device: string) {
    assert.equal((await publicEvent(this, device, event)).me?.revealed, true);
  },
);

Then(
  "su amigo secreto es otro participante distinto de {string}",
  function (this: ApiWorld, name: string) {
    const { receiver } = bodyAs<DrawResult>(this);
    assert.notEqual(receiver, name);
    assert.ok(["Ana", "Beto", "Carla", "Dani"].includes(receiver));
  },
);

Then("los demás participantes no incluyen a {string}", function (this: ApiWorld, name: string) {
  assert.ok(!bodyAs<DrawResult>(this).others.includes(name));
});

Then("el resultado es nuevo", function (this: ApiWorld) {
  assert.equal(bodyAs<DrawResult>(this).alreadyRevealed, false);
});

Then("el resultado ya había sido visto", function (this: ApiWorld) {
  assert.equal(bodyAs<DrawResult>(this).alreadyRevealed, true);
});

Then("el amigo secreto es el mismo que la primera vez", function (this: ApiWorld) {
  assert.equal(bodyAs<DrawResult>(this).receiver, this.firstReceiver);
});

Then(
  "nadie se tocó a sí mismo y cada uno recibe de exactamente una persona",
  function (this: ApiWorld) {
    const pairs = [...(this.results ?? new Map<string, string>()).entries()];
    for (const [giver, receiver] of pairs) assert.notEqual(giver, receiver);
    assert.deepEqual(pairs.map(([, r]) => r).sort(), pairs.map(([g]) => g).sort());
  },
);

Then("creó los eventos {string}", function (this: ApiWorld, names: string) {
  assert.deepEqual(
    bodyAs<MyEvents>(this).created.map((e) => e.name),
    list(names),
  );
});

Then(
  "está en los eventos {string} como {string}",
  function (this: ApiWorld, names: string, participant: string) {
    const joined = bodyAs<MyEvents>(this).joined;
    assert.deepEqual(
      joined.map((e) => e.name),
      list(names),
    );
    assert.ok(joined.every((e) => e.participantName === participant));
  },
);

Then("{string} no ve eventos creados", async function (this: ApiWorld, device: string) {
  const mine = (await this.peek(device, "GET", "/api/me/events")).body as MyEvents;
  assert.equal(mine.created.length, 0);
});

Then(
  "el panel muestra a {string} con nombre elegido y resultado visto",
  function (this: ApiWorld, name: string) {
    const p = bodyAs<AdminView>(this).participants.find((x) => x.name === name);
    assert.deepEqual([p?.claimed, p?.revealed], [true, true]);
  },
);

Then("el panel muestra a {string} libre", function (this: ApiWorld, name: string) {
  const p = bodyAs<AdminView>(this).participants.find((x) => x.name === name);
  assert.deepEqual([p?.claimed, p?.revealed], [false, false]);
});

Then(
  "{string} puede elegir el nombre {string} en {string}",
  async function (this: ApiWorld, device: string, name: string, event: string) {
    assert.equal((await claim(this, device, name, event)).status, 200);
  },
);

Then(
  "el resultado de {string} en {string} es nuevo",
  async function (this: ApiWorld, device: string, event: string) {
    const response = await result(this, device, event);
    assert.equal((response.body as DrawResult).alreadyRevealed, false);
  },
);

Then(
  "al abrir {string}, el evento se llama {string} con presupuesto {string}",
  async function (this: ApiWorld, event: string, name: string, budget: string) {
    const view = await publicEvent(this, "observador", event);
    assert.deepEqual([view.name, view.budget], [name, budget]);
  },
);

Then(
  "{string} ya no encuentra {string}",
  async function (this: ApiWorld, device: string, event: string) {
    const response = await this.peek(device, "GET", `/api/events/${this.tokenOf(event)}`);
    assert.equal(response.status, 404);
  },
);

Then("se le sugiere el evento {string}", function (this: ApiWorld, name: string) {
  const candidates = bodyAs<readonly RecoveryCandidate[]>(this);
  assert.deepEqual(
    candidates.map((c) => c.name),
    [name],
  );
  assert.ok(!JSON.stringify(candidates).includes(this.tokenOf(name)), "no debe filtrar el enlace");
});

Then("no se le sugiere ningún evento", function (this: ApiWorld) {
  assert.deepEqual(bodyAs<readonly RecoveryCandidate[]>(this), []);
});
