// check-scaffold.mjs: the acceptance gate for create-mdp-extension.
//
// Proves, with no network and no `npm install`, that the scaffolder produces a
// working extension package and does so deterministically. It runs the bin
// non-interactively (the path CI and `npx` take), checks the output, and runs
// the generated package's own tests + demo. Writes only to an OS temp dir.
//
// Mirrors the repo's other gates (check-examples, sync freshness): on failure it
// prints a `::error::` line and exits non-zero.

import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BIN = join(ROOT, "packages/create-mdp-extension/bin/create-mdp-extension.mjs");
const NODE = process.execPath;

let checks = 0;
function ok(label) {
  checks++;
  process.stdout.write(`  ok  ${label}\n`);
}
function fail(label, detail) {
  process.stderr.write(`::error::check-scaffold: ${label}\n`);
  if (detail) process.stderr.write(`${detail}\n`);
  process.exit(1);
}

function run(args, opts = {}) {
  return spawnSync(NODE, args, { encoding: "utf8", stdio: "pipe", ...opts });
}

// Scaffold into targetPkg with pinned flags: --yes for non-interactive, --year
// for a byte-stable LICENSE (determinism), no TTY (so the prompt path is never
// taken even without --yes).
function scaffold(targetPkg, extra) {
  const r = run([
    BIN,
    ...extra,
    "--yes",
    "--author",
    "CI",
    "--year",
    "2026",
    "--dir",
    targetPkg,
  ]);
  if (r.status !== 0) fail(`scaffold failed: ${extra.join(" ")}`, r.stdout + r.stderr);
}

function walk(base, sub = "") {
  const here = sub ? join(base, sub) : base;
  const out = [];
  for (const entry of readdirSync(here).sort()) {
    const rel = sub ? `${sub}/${entry}` : entry;
    if (statSync(join(base, rel)).isDirectory()) out.push(...walk(base, rel));
    else out.push(rel);
  }
  return out;
}

function assertIdenticalTrees(a, b, label) {
  const fa = walk(a);
  const fb = walk(b);
  if (fa.join("\n") !== fb.join("\n")) {
    fail(`${label}: file sets differ`, `A:\n${fa.join("\n")}\n\nB:\n${fb.join("\n")}`);
  }
  for (const rel of fa) {
    if (!readFileSync(join(a, rel)).equals(readFileSync(join(b, rel)))) {
      fail(`${label}: ${rel} differs between two runs`);
    }
  }
}

function checkType({ type, name, expectName, expectKeyword, demoNeedle }) {
  const root = mkdtempSync(join(tmpdir(), `mdp-scaffold-${type}-`));
  const a = join(root, "a");
  const b = join(root, "b");
  scaffold(a, [name, "--type", type, "--license", "mit"]);
  scaffold(b, [name, "--type", type, "--license", "mit"]);

  // 1. Deterministic scaffold: two runs, byte-identical.
  assertIdenticalTrees(a, b, `${type} determinism`);
  ok(`${type}: two runs are byte-identical`);

  // 2. Convention lock: name + required keywords.
  const pkg = JSON.parse(readFileSync(join(a, "package.json"), "utf8"));
  if (pkg.name !== expectName) {
    fail(`${type}: package name is "${pkg.name}", expected "${expectName}"`);
  }
  if (JSON.stringify(pkg.keywords) !== JSON.stringify(["mdp", expectKeyword])) {
    fail(
      `${type}: keywords are ${JSON.stringify(pkg.keywords)}, expected ["mdp","${expectKeyword}"]`
    );
  }
  ok(`${type}: package name + keywords follow the convention`);

  // 3. Working package: its own tests pass, with no install and no network.
  const t = run(["--test"], { cwd: a });
  if (t.status !== 0) fail(`${type}: generated "node --test" failed`, t.stdout + t.stderr);
  ok(`${type}: generated tests pass`);

  // 4. The demo renders a preview.
  const d = run(["demo.mjs"], { cwd: a });
  if (d.status !== 0) fail(`${type}: generated demo failed`, d.stdout + d.stderr);
  const preview = join(a, "dist", "preview.html");
  if (!existsSync(preview)) fail(`${type}: demo did not write dist/preview.html`);
  if (!readFileSync(preview, "utf8").includes(demoNeedle)) {
    fail(`${type}: preview.html is missing "${demoNeedle}"`);
  }
  ok(`${type}: demo writes a working preview`);
}

// The vendored escaper in each template must match @mdp/core byte-for-byte.
function checkVendorDrift() {
  const core = readFileSync(join(ROOT, "packages/core/src/inline.mjs"));
  for (const type of ["block", "artifact"]) {
    const tmpl = join(
      ROOT,
      `packages/create-mdp-extension/templates/${type}/src/_inline.mjs.tmpl`
    );
    if (!core.equals(readFileSync(tmpl))) {
      fail(
        `${type}: vendored _inline.mjs is stale`,
        `Run 'npm run sync:ext-vendor' and commit. (${tmpl})`
      );
    }
  }
  ok("vendored _inline.mjs matches @mdp/core (no drift)");
}

process.stdout.write("check-scaffold: create-mdp-extension acceptance\n");
checkVendorDrift();
checkType({
  type: "block",
  name: "tag-list",
  expectName: "mdp-block-tag-list",
  expectKeyword: "mdp-block",
  demoNeedle: "mdp-tag-list",
});
checkType({
  type: "artifact",
  name: "card",
  expectName: "mdp-artifact-card",
  expectKeyword: "mdp-artifact",
  demoNeedle: "mdp-card",
});
process.stdout.write(`\n${checks} checks passed.\n`);
