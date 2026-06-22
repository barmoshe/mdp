// test.mjs: a standalone smoke test, no test runner (matches the repo's
// "tests = small node scripts" convention, like scripts/check-contrast.mjs).
// It imports the PURE handlers from src/tools.mjs (no stdio, no SDK) and asserts
// compile output, validate behaviour, and determinism. Exits non-zero on the
// first failure so CI fails loudly. Run: node test.mjs (after `npm run sync:mcp`).
import { readFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mdpCompile, mdpValidate, mdpPresent } from "./src/tools.mjs";
import { artifactFilename } from "./src/io.mjs";
import { ARTIFACTS } from "./src/engine.mjs";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "assets");

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`  ok   ${name}`);
  else {
    console.error(`  FAIL ${name}`);
    failures++;
  }
}

// Per-form stable markers, verified against packages/core/src renderers.
const MARKERS = {
  page: ['<main class="mdp-page">', "mdp-page-masthead"],
  slides: ["mdp-deck", '<section class="mdp-slide'],
  flyer: ["mdp-flyer", "mdp-flyer-band"],
  report: ['<article class="mdp-report">', "mdp-report-cover"],
  onepager: ['<article class="mdp-onepager">', "mdp-onepager-header"],
  memo: ['<article class="mdp-memo">', "mdp-memo-meta"],
  letter: ['<article class="mdp-letter">', "mdp-letter-body"],
};

const GOOD = `---
mdp: 1
theme: studio
title: Smoke Test
---

# Smoke Test
{.lead} A tiny source that exercises every form.

---

## Numbers
\`\`\`mdp:stats
Revenue: $1.2M
Users: 48k
\`\`\`
`;

// Unknown container + no title: parse() must degrade (not throw), validate must
// surface issues.
const MALFORMED = `:::mystery
text the parser does not recognise as a known directive
:::
`;

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "mdp-mcp-test-"));

  // 1. compile all forms: file written, markers present, stats value rendered.
  const all = await mdpCompile({ source: GOOD, form: "all", out_dir: dir });
  check(`compile all -> ${ARTIFACTS.length} artifacts`, all.artifacts.length === ARTIFACTS.length);
  for (const art of all.artifacts) {
    const html = readFileSync(art.path, "utf8");
    check(`${art.form}: file has bytes`, art.bytes > 0 && Buffer.byteLength(html, "utf8") === art.bytes);
    check(`${art.form}: generator meta`, html.includes('<meta name="generator" content="MDP">'));
    for (const m of MARKERS[art.form]) check(`${art.form}: contains ${m}`, html.includes(m));
    check(`${art.form}: stats rendered`, html.includes("48k"));
  }

  // 1b. brand-logo: a safe value renders exactly one masthead <img> in each form;
  // an unsafe value drops to no logo (ADR 0090).
  const BRANDED = GOOD.replace("title: Smoke Test\n", "title: Smoke Test\nbrand-logo: ./logo.svg\n");
  const branded = await mdpCompile({ source: BRANDED, form: "all", out_dir: dir });
  for (const art of branded.artifacts) {
    const html = readFileSync(art.path, "utf8");
    check(`${art.form}: brand-logo renders one masthead img`, (html.match(/<img class="mdp-logo"/g) || []).length === 1);
  }
  const UNSAFE = GOOD.replace("title: Smoke Test\n", "title: Smoke Test\nbrand-logo: javascript:alert(1)\n");
  const unsafe = await mdpCompile({ source: UNSAFE, form: "page", out_dir: dir });
  check("brand-logo: unsafe value drops to no logo", !readFileSync(unsafe.artifacts[0].path, "utf8").includes('<img class="mdp-logo"'));

  // 2a. validate good source.
  const ok = await mdpValidate({ source: GOOD });
  check("validate good: ok=true", ok.ok === true);
  check("validate good: counts title", ok.blocks.title === 1);
  check("validate good: counts stats", ok.blocks.stats === 1);
  check("validate good: no issues", ok.issues.length === 0);

  // 2b. validate malformed: never throws, reports issues.
  const bad = await mdpValidate({ source: MALFORMED });
  check("validate malformed: ok=false", bad.ok === false);
  check("validate malformed: has issues", bad.issues.length > 0);
  check("validate malformed: returned an object (did not throw)", typeof bad === "object");

  // 3. determinism: source-hash filename + identical bytes across out_dirs.
  const a = await mdpCompile({ source: GOOD, form: "page", out_dir: dir });
  const b = await mdpCompile({ source: GOOD, form: "page", out_dir: join(dir, "second") });
  check("determinism: filename is source-hash", a.artifacts[0].path.endsWith(artifactFilename(GOOD, "page")));
  check("determinism: same bytes across dirs", a.artifacts[0].bytes === b.artifacts[0].bytes);
  check(
    "determinism: identical HTML",
    readFileSync(a.artifacts[0].path, "utf8") === readFileSync(b.artifacts[0].path, "utf8")
  );

  // 3b. vendored manifests resolve (written by sync-mcp): for examples and
  // templates, the manifest id-set equals the vendored file-set and every id
  // maps to a non-empty .mdp. This is what the server's resource list derives from.
  for (const kind of ["examples", "templates"]) {
    const man = JSON.parse(readFileSync(join(ASSETS, kind, "manifest.json"), "utf8"));
    const files = readdirSync(join(ASSETS, kind)).filter((f) => f.endsWith(".mdp")).sort();
    const ids = man.map((e) => e.file).sort();
    check(`${kind}: manifest id-set == vendored file-set`, JSON.stringify(files) === JSON.stringify(ids));
    let allResolve = man.length > 0;
    for (const e of man) {
      if (!readFileSync(join(ASSETS, kind, `${e.id}.mdp`), "utf8").trim()) allResolve = false;
    }
    check(`${kind}: every manifest id resolves to non-empty bytes`, allResolve);
  }

  // 4. present (opt-in via MDP_TEST_PRESENT; never opens a browser): loopback serve + fetch.
  if (process.env.MDP_TEST_PRESENT) {
    process.env.MDP_NO_OPEN = "1";
    const { previewServerCount } = await import("./src/present.mjs");
    const pres = await mdpPresent({ source: GOOD, form: "slides", out_dir: dir });
    check("present: 127.0.0.1 url", /^http:\/\/127\.0\.0\.1:\d+\//.test(pres.url || ""));
    const resp = await fetch(pres.url);
    const body = await resp.text();
    check("present: serves 200", resp.status === 200);
    check("present: served the slides html", body.includes("mdp-deck"));
    check("present: a server is open", previewServerCount() >= 1);
  }

  console.log(failures === 0 ? "\nmdp-mcp smoke: PASS" : `\nmdp-mcp smoke: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
