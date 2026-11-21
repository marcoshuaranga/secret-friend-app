import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AfterAll, BeforeAll, setDefaultTimeout } from "@cucumber/cucumber";

/**
 * Levanta el Worker real (`wrangler dev`) con la web compilada y un D1 local nuevo.
 * Requiere `pnpm build` antes (lo hace `pnpm test:e2e` en la raíz).
 */
export const PORT = 8799;
export const BASE_URL = `http://localhost:${PORT}`;

const apiDir = new URL("../../../api/", import.meta.url).pathname;
let server: ChildProcess | undefined;
let state: string | undefined;

setDefaultTimeout(60_000);

const run = (args: readonly string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["exec", "wrangler", ...args], { cwd: apiDir, stdio: "ignore" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`wrangler ${args[0]}: ${code}`)),
    );
  });

const waitForHealth = async (): Promise<void> => {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE_URL}/api/health`)).ok) return;
    } catch {
      // Todavía arrancando.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("wrangler dev no respondió");
};

BeforeAll({ timeout: 120_000 }, async () => {
  state = await mkdtemp(join(tmpdir(), "sf-e2e-"));
  await run(["d1", "migrations", "apply", "DB", "--local", "--persist-to", state]);
  server = spawn(
    "pnpm",
    ["exec", "wrangler", "dev", "--port", String(PORT), "--ip", "127.0.0.1", "--persist-to", state],
    { cwd: apiDir, stdio: "ignore", detached: true },
  );
  await waitForHealth();
});

AfterAll(async () => {
  if (server?.pid) process.kill(-server.pid);
  if (state) await rm(state, { recursive: true, force: true });
});
