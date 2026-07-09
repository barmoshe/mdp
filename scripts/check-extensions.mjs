// check-extensions.mjs: the acceptance gate for the curated extension examples
// under extensions/.
//
// Proves, with no network and no `npm install`, that each example package is a
// faithful, working, deterministic extension: it follows the naming + keyword
// convention, its vendored design files have not drifted from the engine, its own
// tests pass, and its demo writes a working, deterministic preview. Mirrors
// scripts/check-scaffold.mjs: on failure it prints a `::error::` line and exits
// non-zero. Writes only inside each package's own dist/.

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const EXT = join(ROOT, "extensions");
const NODE = process.execPath;
// The vendored core chain every extension carries: the escaper plus the color
// modules inline.mjs pulls in for swatches. [core source, vendored name].
const VENDORED_CORE = [
  ["packages/core/src/inline.mjs", "_inline.mjs"],
  ["packages/core/src/color.mjs", "color.mjs"],
  ["packages/core/src/named-colors.mjs", "named-colors.mjs"],
];
const TMPL_TOKENS = join(
  ROOT,
  "packages/create-mdp-extension/templates/artifact/src/_tokens.mjs.tmpl"
);

let checks = 0;
function ok(label) {
  checks++;
  process.stdout.write(`  ok  ${label}\n`);
}
function fail(label, detail) {
  process.stderr.write(`::error::check-extensions: ${label}\n`);
  if (detail) process.stderr.write(`${detail}\n`);
  process.exit(1);
}
function run(args, opts = {}) {
  return spawnSync(NODE, args, { encoding: "utf8", stdio: "pipe", ...opts });
}

// The curated set. Each entry pins the convention (name + keyword) and the demo
// needle. `tokens: true` also drift-checks the vendored _tokens.mjs (artifacts).
const EXTENSIONS = [
  { dir: "mdp-block-status", name: "mdp-block-status", keyword: "mdp-block", needle: "mdp-status", tokens: false },
  { dir: "mdp-block-spec-sheet", name: "mdp-block-spec-sheet", keyword: "mdp-block", needle: "mdp-spec-sheet", tokens: false },
  { dir: "mdp-artifact-resume", name: "mdp-artifact-resume", keyword: "mdp-artifact", needle: "mdp-resume", tokens: true },
];

const coreVendored = VENDORED_CORE.map(([src, name]) => [name, readFileSync(join(ROOT, src))]);
const tmplTokens = existsSync(TMPL_TOKENS) ? readFileSync(TMPL_TOKENS) : null;

process.stdout.write("check-extensions: curated MDP extension examples\n");

for (const ext of EXTENSIONS) {
  const pkgDir = join(EXT, ext.dir);
  if (!existsSync(pkgDir)) fail(`${ext.dir}: directory is missing`);

  // 1. Convention lock: name + required keywords.
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  if (pkg.name !== ext.name) {
    fail(`${ext.dir}: package name is "${pkg.name}", expected "${ext.name}"`);
  }
  if (JSON.stringify(pkg.keywords) !== JSON.stringify(["mdp", ext.keyword])) {
    fail(
      `${ext.dir}: keywords are ${JSON.stringify(pkg.keywords)}, expected ["mdp","${ext.keyword}"]`
    );
  }
  ok(`${ext.dir}: name + keywords follow the convention`);

  // 2. Vendored design files match the engine byte-for-byte (no drift).
  for (const [name, bytes] of coreVendored) {
    if (!bytes.equals(readFileSync(join(pkgDir, "src", name)))) {
      fail(`${ext.dir}: vendored src/${name} differs from packages/core/src/${name}`);
    }
  }
  if (ext.tokens) {
    if (!tmplTokens) fail("the artifact template _tokens.mjs.tmpl is missing");
    if (!tmplTokens.equals(readFileSync(join(pkgDir, "src/_tokens.mjs")))) {
      fail(`${ext.dir}: vendored src/_tokens.mjs differs from the artifact template`);
    }
  }
  ok(`${ext.dir}: vendored design files match (no drift)`);

  // 3. Its own tests pass, with no install and no network.
  const t = run(["--test"], { cwd: pkgDir });
  if (t.status !== 0) fail(`${ext.dir}: "node --test" failed`, t.stdout + t.stderr);
  ok(`${ext.dir}: tests pass`);

  // 4. The demo renders a working preview that holds the expected needle.
  const d1 = run(["demo.mjs"], { cwd: pkgDir });
  if (d1.status !== 0) fail(`${ext.dir}: demo failed`, d1.stdout + d1.stderr);
  const preview = join(pkgDir, "dist", "preview.html");
  if (!existsSync(preview)) fail(`${ext.dir}: demo did not write dist/preview.html`);
  const bytes1 = readFileSync(preview);
  if (!bytes1.toString("utf8").includes(ext.needle)) {
    fail(`${ext.dir}: preview.html is missing "${ext.needle}"`);
  }
  ok(`${ext.dir}: demo writes a working preview`);

  // 5. Determinism: a second demo run is byte-identical to the first.
  const d2 = run(["demo.mjs"], { cwd: pkgDir });
  if (d2.status !== 0) fail(`${ext.dir}: second demo run failed`, d2.stdout + d2.stderr);
  if (!bytes1.equals(readFileSync(preview))) {
    fail(`${ext.dir}: demo output is not deterministic across two runs`);
  }
  ok(`${ext.dir}: demo output is deterministic`);
}

process.stdout.write(`\n${checks} checks passed.\n`);
