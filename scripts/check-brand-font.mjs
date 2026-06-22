// check-brand-font.mjs: the gate for the brand-font allowlist.
//
// brand-font overrides only the body/UI family, from a closed set of system font
// stacks (no web fonts). It must stay deterministic and fail closed: an unknown
// value is ignored and the document keeps the theme default. This asserts the
// allowlist resolves, the override lands, the serif role survives, and an unknown
// value is byte-identical to no brand-font across every form.
//
// Run: npm test   (from the repo root)
import { compile, ARTIFACTS } from "../packages/core/src/index.mjs";
import { deriveBrandFont } from "../packages/core/src/shared.mjs";
import { FONT_STACKS } from "../packages/core/src/tokens.mjs";

let failures = 0;
const fail = (m) => { console.error(`  FAIL ${m}`); failures++; };
const ok = (m) => console.log(`  ok   ${m}`);
const mk = (extra) => `---\nmdp: 1\ntheme: studio\n${extra}title: T\n---\n# T\n{.lead} x\n`;

// (a) every allowlisted key resolves; unknown -> null; case-insensitive.
for (const key of Object.getOwnPropertyNames(FONT_STACKS)) {
  if (deriveBrandFont({ meta: { "brand-font": key } })) ok(`resolves: ${key}`);
  else fail(`does not resolve: ${key}`);
}
if (deriveBrandFont({ meta: { "brand-font": "comic-sans" } }) === null) ok("unknown font -> null (fallback)");
else fail("unknown font did not fall back");
if (deriveBrandFont({ meta: { "brand-font": "MONO" } })) ok("case-insensitive");
else fail("not case-insensitive");

// (b) a valid brand-font overrides --mdp-font-sans and keeps the serif role.
const mono = compile(mk("brand-font: mono\n"), "page");
if (mono.includes("--mdp-font-sans: ui-monospace")) ok("override emitted into the token block");
else fail("override not emitted");
if (mono.includes("--mdp-font-serif:")) ok("serif role preserved (two-family character kept)");
else fail("serif role missing");

// (c) fail-closed + byte-identity across every form: unknown font == no font.
let allEq = true;
for (const f of ARTIFACTS) {
  if (compile(mk(""), f) !== compile(mk("brand-font: nope\n"), f)) { allEq = false; fail(`unknown font changed ${f}`); }
}
if (allEq) ok(`unknown brand-font byte-identical to none across all ${ARTIFACTS.length} forms`);

// (d) determinism.
if (compile(mk("brand-font: rounded\n"), "page") === compile(mk("brand-font: rounded\n"), "page")) ok("determinism: stable");
else fail("determinism: differs");

console.log(failures === 0 ? "\ncheck-brand-font: PASS" : `\ncheck-brand-font: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
