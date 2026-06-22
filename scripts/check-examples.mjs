// check-examples.mjs: the drift gate for the example + template libraries.
//
// Asserts the manifests match the files on disk, the role vocabulary is clean,
// and the example demonstrates: tags cover every engine-implemented feature.
// Pure reads, no git, no network. Run via `npm run check:examples` (also in CI).
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "../packages/core/src/index.mjs";
import { MANIFEST as EXAMPLES, ALLOWED_ROLES as EX_ROLES } from "../examples/manifest.mjs";
import { MANIFEST as TEMPLATES, ALLOWED_ROLES as TMPL_ROLES } from "../templates/manifest.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
let failures = 0;
const fail = (m) => { console.error(`  FAIL ${m}`); failures++; };
const ok = (m) => console.log(`  ok   ${m}`);

// (a) the manifest file-set equals the directory *.mdp set, for both kinds.
function checkFiles(kind, manifest) {
  const disk = readdirSync(join(root, kind)).filter((f) => f.endsWith(".mdp")).sort();
  const man = manifest.map((e) => e.file).sort();
  const onlyDisk = disk.filter((f) => !man.includes(f));
  const onlyMan = man.filter((f) => !disk.includes(f));
  if (onlyDisk.length || onlyMan.length) {
    fail(`${kind}: manifest and disk disagree. only on disk: [${onlyDisk}], only in manifest: [${onlyMan}]`);
  } else {
    ok(`${kind}: manifest matches ${disk.length} files on disk`);
  }
}
checkFiles("examples", EXAMPLES);
checkFiles("templates", TEMPLATES);

// (b) ids unique; every role in the allowed set; an example carries ci-determinism.
function checkRoles(kind, manifest, allowed) {
  const ids = manifest.map((e) => e.id);
  if (new Set(ids).size !== ids.length) fail(`${kind}: duplicate ids`);
  else ok(`${kind}: ids unique`);
  let bad = false;
  for (const e of manifest) {
    for (const r of e.roles) {
      if (!allowed.includes(r)) { fail(`${kind}: ${e.id} has unknown role "${r}"`); bad = true; }
    }
  }
  if (!bad) ok(`${kind}: all roles within the allowed set`);
}
checkRoles("examples", EXAMPLES, EX_ROLES);
checkRoles("templates", TEMPLATES, TMPL_ROLES);
if (EXAMPLES.some((e) => e.roles.includes("ci-determinism"))) ok("examples: a ci-determinism target exists");
else fail("examples: no entry carries ci-determinism");

// (c) coverage: the demonstrates: tags across all examples cover every feature
// the engine implements today. note/columns/reveals are intentionally excluded
// (unimplemented), so this required set is satisfiable.
const REQUIRED = [
  "stats", "compare", "flow", "quote", "list", "lead", "cite", "brand-logo", "brand-accent", "brand-font", "rtl",
  "table", "chart", "diagram",
  "callout:note", "callout:tip", "callout:cost", "callout:recommendation", "callout:warning",
];
const seen = new Set();
const themesSeen = new Set();
for (const e of EXAMPLES) {
  const { meta } = parse(readFileSync(join(root, "examples", e.file), "utf8"));
  if (Array.isArray(meta.demonstrates)) for (const t of meta.demonstrates) seen.add(t);
  if (meta.theme) themesSeen.add(meta.theme);
}
const missing = REQUIRED.filter((t) => !seen.has(t));
if (missing.length) fail(`coverage: features not demonstrated by any example: [${missing}]`);
else ok(`coverage: all ${REQUIRED.length} required features demonstrated`);

const THEMES = ["studio", "ocean", "teal", "forest", "amber", "terracotta", "coral", "rose", "plum", "violet", "mono"];
const missingThemes = THEMES.filter((t) => !themesSeen.has(t));
if (missingThemes.length) fail(`coverage: themes never used as a lead: [${missingThemes}]`);
else ok("coverage: all 11 themes appear as a lead theme");

console.log(failures === 0 ? "\ncheck-examples: PASS" : `\ncheck-examples: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
