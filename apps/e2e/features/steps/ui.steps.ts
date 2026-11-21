import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import type { UiWorld } from "../support/world.ts";

const PASSWORD = "secreto123";

Given(
  "que Ana crea el evento {string} con {string}",
  async function (this: UiWorld, name: string, list: string) {
    const page = await this.page("Ana");
    await page.goto("/nuevo");
    await page.fill("#name", name);
    await page.fill("#participant", list);
    await page.click("#add");
    await page.fill("#password", PASSWORD);
    await page.click("#submit");
    await page.locator("#done").waitFor();
    this.eventLink = (await page.textContent("#link")) ?? "";
    assert.match(this.eventLink, /\/e\?t=[\w-]{43}$/);
  },
);

When(/^(\w+) abre el enlace$/, async function (this: UiWorld, person: string) {
  await (await this.page(person)).goto(this.eventLink);
});

When(
  /^(\w+) elige su nombre "([^"]+)"$/,
  async function (this: UiWorld, person: string, name: string) {
    const page = await this.page(person);
    if (!page.url().includes("/e?")) await page.goto(this.eventLink);
    await page.locator("#names").getByRole("button", { name }).click();
    await page.locator("#confirm").getByRole("button", { name: "Sí, soy yo" }).click();
    await page.locator("#spin").waitFor();
  },
);

When("Ana tira de la ruleta hacia abajo", async function (this: UiWorld) {
  const page = await this.page("Ana");
  const box = await page.locator("[data-window]").boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(x, box.y + box.height, { steps: 4 });
  await page.mouse.up();
});

Then("Ana ve a quién le regala, y no es ella misma", async function (this: UiWorld) {
  const page = await this.page("Ana");
  await page.locator("#result").waitFor({ timeout: 20_000 });
  this.firstReceiver = (await page.textContent("#receiver")) ?? "";
  assert.ok(["Beto", "Carla", "Dani"].includes(this.firstReceiver), this.firstReceiver);
});

When("Ana vuelve a abrir el enlace", async function (this: UiWorld) {
  await (await this.page("Ana")).goto(this.eventLink);
});

Then("Ana ve el mismo resultado sin la ruleta", async function (this: UiWorld) {
  const page = await this.page("Ana");
  await page.locator("#result").waitFor();
  assert.equal(await page.textContent("#receiver"), this.firstReceiver);
  assert.equal(await page.locator("#spin").isVisible(), false);
});

Then(
  /^(\w+) ve el nombre "([^"]+)" como tomado$/,
  async function (this: UiWorld, person: string, name: string) {
    const page = await this.page(person);
    const button = page.locator("#names").getByRole("button", { name });
    await button.waitFor();
    assert.equal(await button.isDisabled(), true);
  },
);

Then(
  /^(\w+) puede elegir su nombre "([^"]+)" y girar con el botón$/,
  async function (this: UiWorld, person: string, name: string) {
    const page = await this.page(person);
    await page.locator("#names").getByRole("button", { name }).click();
    await page.locator("#confirm").getByRole("button", { name: "Sí, soy yo" }).click();
    await page.locator("[data-spin]").click();
    await page.locator("#result").waitFor({ timeout: 20_000 });
    assert.notEqual(await page.textContent("#receiver"), name);
  },
);

When('Ana abre su panel desde "Mis eventos"', async function (this: UiWorld) {
  const page = await this.page("Ana");
  await page.goto("/");
  await page.locator("#my-events-list a").first().click();
  await page.locator("#panel").waitFor();
});

Then(
  "el panel muestra a {string} como {string}",
  async function (this: UiWorld, name: string, status: string) {
    const page = await this.page("Ana");
    const row = page.locator("#people li", { hasText: name });
    await row.getByText(status).waitFor();
  },
);

When("Ana libera el nombre de {string}", async function (this: UiWorld, name: string) {
  const page = await this.page("Ana");
  await page.getByRole("button", { name: `Liberar el nombre de ${name}` }).click();
  await page.locator("#confirm-release").getByRole("button", { name: "Liberar" }).click();
});

When("Ana abre el panel en otro teléfono", async function (this: UiWorld) {
  const page = await this.page("Ana en otro teléfono");
  await page.goto(this.eventLink.replace("/e?", "/admin?"));
});

Then("se le pide la contraseña de organizador", async function (this: UiWorld) {
  await (await this.page("Ana en otro teléfono")).locator("#login").waitFor();
});

When("escribe la contraseña {string}", async function (this: UiWorld, password: string) {
  const page = await this.page("Ana en otro teléfono");
  await page.fill("#login-password", password);
  await page.locator("#login-form").getByRole("button").click();
});

Then("ve el panel de {string}", async function (this: UiWorld, name: string) {
  const page = await this.page("Ana en otro teléfono");
  await page.locator("#panel").waitFor();
  assert.equal(await page.textContent("#panel-name"), name);
});
