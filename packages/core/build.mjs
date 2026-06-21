// build.mjs: the MDP spike CLI.
//
// Reads one .mdp source (argv[2], default examples/tidewater.mdp), compiles all
// three artifacts, and writes dist/page.html, dist/slides.html, dist/flyer.html
// at the repo root. Logs what it wrote. Deterministic: no clocks, no randomness,
// stable ordering, so two runs produce byte-identical files.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { compile, ARTIFACTS } from "./src/index.mjs";

// Resolve paths relative to the repo root (two levels up from packages/core/).
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

const inputArg = process.argv[2];
const inputPath = inputArg
  ? resolve(process.cwd(), inputArg)
  : join(repoRoot, "examples", "tidewater.mdp");

const distDir = join(repoRoot, "dist");
mkdirSync(distDir, { recursive: true });

const source = readFileSync(inputPath, "utf8");

console.log(`MDP build`);
console.log(`  source: ${inputPath}`);

for (const artifact of ARTIFACTS) {
  const html = compile(source, artifact);
  const outPath = join(distDir, `${artifact}.html`);
  writeFileSync(outPath, html, "utf8");
  const bytes = Buffer.byteLength(html, "utf8");
  console.log(`  wrote:  dist/${artifact}.html  (${bytes} bytes)`);
}

console.log(`Done. Compiled ${ARTIFACTS.length} artifacts.`);
