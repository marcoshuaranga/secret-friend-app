import { build } from "esbuild";

const entry = process.argv[2] ?? "src/index.ts";
const outfile = process.argv[3] ?? "dist/index.js";

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  minify: false,
});
