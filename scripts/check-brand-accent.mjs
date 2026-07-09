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
  normalizeColor,
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

// (e) normalizeColor: the shared front door canonicalizes every accepted syntax to
// one opaque hex and rejects everything else (fail closed). Alpha is dropped.
{
  const CASES = [
    ["#abc", "#aabbcc"],
    ["#AABBCC", "#aabbcc"],
    ["#0C0B40", "#0c0b40"],
    ["#f00a", "#ff0000"],       // 4-digit shorthand, alpha dropped
    ["#00008080", "#000080"],   // 8-digit, alpha dropped
    ["navy", "#000080"],
    ["RebeccaPurple", "#663399"],
    ["rgb(0,0,128)", "#000080"],
    ["rgb(0 0 128 / 50%)", "#000080"],
    ["rgb(50%, 0%, 0%)", "#800000"],
    ["hsl(240, 100%, 25%)", "#000080"],
    ["hsl(240deg 100% 25%)", "#000080"],
    ["  navy  ", "#000080"],     // trimmed
  ];
  let normOk = true;
  for (const [input, want] of CASES) {
    const got = normalizeColor(input);
    if (got !== want) { fail(`normalizeColor(${JSON.stringify(input)}) = ${got}, want ${want}`); normOk = false; }
  }
  if (normOk) ok(`normalizeColor canonicalizes all ${CASES.length} accepted syntaxes`);

  const REJECT = ["transparent", "#12345", "#1234567", "not-a-color", "npm run build", "rgb(0,0)", "", "  ", "#", "rgb()"];
  let rejOk = true;
  for (const bad of REJECT) {
    if (normalizeColor(bad) !== null) { fail(`normalizeColor(${JSON.stringify(bad)}) should be null`); rejOk = false; }
  }
  if (rejOk) ok(`normalizeColor rejects all ${REJECT.length} non-colors (fail closed)`);
}

// (f) the loosened brand-accent path: a CSS name / rgb() / hsl() now drives the
// same derivation as the equivalent hex, and compiles to the same token block.
{
  const base = `---\nmdp: 1\ntheme: forest\ntitle: T\n---\n# T\n{.lead} x\n`;
  const withVal = (v) => base.replace("title: T", `brand-accent: ${v}\ntitle: T`);
  const navyFill = deriveAccent("#000080").light.fill;
  for (const v of ["navy", "rgb(0,0,128)", "hsl(240, 100%, 25%)", "#000080"]) {
    if (compile(withVal(v), "page").includes(`--mdp-accent: ${navyFill}`)) {
      ok(`integration: brand-accent: ${v} emits the derived navy fill`);
    } else fail(`integration: brand-accent: ${v} did not emit the navy fill`);
  }
}

console.log(failures === 0 ? "\ncheck-brand-accent: PASS" : `\ncheck-brand-accent: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
