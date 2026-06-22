// check-brand-accent.mjs: the gate for custom brand-accent derivation.
//
// brand-accent lets the author name one brand color; the engine derives the full
// accent set from it. That derivation must be accessible by construction (the
// same promise the named themes keep), deterministic (byte-identical builds), and
// fail closed (a bad or inaccessible color falls back to the named theme, never
// breaks the page). This test asserts all four, using the SAME contrast oracle
// the engine ships (imported, not redefined).
//
// Run: npm test   (from the repo root)
import {
  deriveAccent,
  deriveAccent2,
  contrast,
  relativeLuminance,
  TEXT_MIN,
  FILL_MIN,
  compile,
} from "../packages/core/src/index.mjs";

// The neutral backgrounds the accent is read against (must match tokens.mjs).
const LIGHT_BG = "#fdfcfb";
const DARK_BG = "#141413";
const f = (n) => n.toFixed(2);

let failures = 0;
const fail = (m) => { console.error(`  FAIL ${m}`); failures++; };
const ok = (m) => console.log(`  ok   ${m}`);

// A spread of brand colors incl. the hard ones: luminous yellow, near-gray, a
// dark near-black, plus typical brand hues.
const SAMPLES = ["#7DB74B", "#FFCC00", "#5b54d6", "#2f6fd6", "#c0392b", "#1abc9c", "#222222"];

// (a) every sample derives a non-null accent that passes AA in both modes.
for (const hex of SAMPLES) {
  const a = deriveAccent(hex);
  if (!a) { fail(`${hex}: deriveAccent returned null`); continue; }
  for (const mode of ["light", "dark"]) {
    const bg = mode === "light" ? LIGHT_BG : DARK_BG;
    const v = a[mode];
    const cText = contrast(v.text, bg);
    const cFill = contrast(v.contrast, v.fill);
    if (cText < TEXT_MIN) fail(`${hex}/${mode}: text vs bg ${f(cText)} < ${TEXT_MIN}`);
    if (cFill < FILL_MIN) fail(`${hex}/${mode}: on-fill ${f(cFill)} < ${FILL_MIN}`);
  }
}
if (!failures) ok(`all ${SAMPLES.length} brand accents pass AA (text + on-fill) in light and dark`);

// (b) the #FFCC00 case: a luminous yellow fill must take the DARK on-fill label,
// not an unreadable white one. Checked on the secondary, where yellow stays vivid.
{
  const s = deriveAccent2("#FFCC00");
  if (!s) fail("#FFCC00: deriveAccent2 returned null");
  else if (relativeLuminance(s.light.contrast) < relativeLuminance(s.light.fill)) {
    ok("#FFCC00 secondary: vivid fill takes a dark on-fill label");
  } else fail("#FFCC00 secondary: on-fill label is not the dark one");
}

// (c) determinism: the same hex derives a byte-identical set across calls.
if (JSON.stringify(deriveAccent("#7DB74B")) === JSON.stringify(deriveAccent("#7DB74B"))) {
  ok("determinism: deriveAccent is stable across calls");
} else fail("determinism: deriveAccent differs across calls");

// (d) fail-closed + byte-identity through compile(): a malformed or quoted accent
// is ignored and compiles identically to the same source with no brand-accent; a
// valid accent changes the output (the derived fill appears in the token block).
{
  const base = `---\nmdp: 1\ntheme: forest\ntitle: T\n---\n# T\n{.lead} x\n`;
  const bad = base.replace("title: T", "brand-accent: not-a-hex\ntitle: T");
  const quoted = base.replace("title: T", 'brand-accent: "#7DB74B"\ntitle: T');
  const good = base.replace("title: T", "brand-accent: #7DB74B\ntitle: T");
  for (const form of ["page", "slides", "flyer"]) {
    if (compile(base, form) === compile(bad, form)) ok(`fail-closed: bad hex is a no-op (${form})`);
    else fail(`fail-closed: bad hex changed output (${form})`);
    if (compile(base, form) === compile(quoted, form)) ok(`fail-closed: quoted hex is a no-op (${form})`);
    else fail(`fail-closed: quoted hex changed output (${form})`);
  }
  const fill = deriveAccent("#7DB74B").light.fill;
  if (compile(good, "page").includes(`--mdp-accent: ${fill}`)) {
    ok("integration: a valid brand-accent emits the derived fill");
  } else fail("integration: derived fill not found in compiled output");
}

console.log(failures === 0 ? "\ncheck-brand-accent: PASS" : `\ncheck-brand-accent: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
