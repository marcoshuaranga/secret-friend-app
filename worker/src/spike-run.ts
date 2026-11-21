import { validateCreateEvent } from "./spike";
const ok = validateCreateEvent({ name: "Navidad", participants: ["a", "b", "c"] });
const bad = validateCreateEvent({ name: "", participants: ["a"] });
console.log(JSON.stringify({ ok: ok.success, bad: bad.success, errors: bad.success ? [] : bad.errors.map((e) => e.path) }));
