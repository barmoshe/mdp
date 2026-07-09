// check-swatch.mjs: the gate for inline color swatches.
//
// A code span whose entire body is one recognized color literal (hex, rgb()/hsl(),
// or a CSS color name) renders a small color chip inside the <code>. The chip color
// is the NORMALIZED hex, so the inline style only ever carries a 6-digit hex — no
// author text reaches CSS. This test asserts the chip appears with the right color
// for each syntax, that ordinary code stays chip-less, and that the .mdp-swatch rule
// ships in the stylesheet.
//
// Run: npm test   (from the repo root)
import { compile } from "../packages/core/src/index.mjs";

let failures = 0;
const fail = (m) => { console.error(`  FAIL ${m}`); failures++; };
const ok = (m) => console.log(`  ok   ${m}`);

const doc = `---
mdp: 1
title: Colors
---
# Colors

{.lead} Palette

Navy \`#0C0B40\`, name \`navy\`, func \`rgb(0,0,128)\`, short \`#f00\`, and code \`npm run build\`.
`;

const html = compile(doc, "page");

// Each color literal emits a chip with its normalized hex background.
const CHIPS = [
  ["#0C0B40", "#0c0b40"],
  ["navy", "#000080"],
  ["rgb(0,0,128)", "#000080"],
  ["#f00", "#ff0000"],
];
for (const [label, hex] of CHIPS) {
  const chip = `<span class="mdp-swatch" style="background:${hex}"></span>`;
  if (html.includes(chip)) ok(`chip for ${label} -> ${hex}`);
  else fail(`missing chip for ${label} (expected background ${hex})`);
}

// Ordinary code must NOT get a swatch.
if (!html.includes(`mdp-swatch"></span>npm run build`) && html.includes("<code>npm run build</code>")) {
  ok("ordinary code span stays chip-less");
} else fail("ordinary code span was swatched");

// The stylesheet ships the .mdp-swatch rule.
if (html.includes(".mdp-swatch {")) ok(".mdp-swatch CSS rule is present");
else fail(".mdp-swatch CSS rule missing from stylesheet");

// The inline style never carries a raw author string — only a #rrggbb value.
const styles = [...html.matchAll(/class="mdp-swatch" style="background:([^"]*)"/g)].map((m) => m[1]);
if (styles.length && styles.every((v) => /^#[0-9a-f]{6}$/.test(v))) {
  ok(`all ${styles.length} chip backgrounds are 6-digit hex (injection-safe)`);
} else fail(`a chip background is not a plain 6-digit hex: ${JSON.stringify(styles)}`);

console.log(failures === 0 ? "\ncheck-swatch: PASS" : `\ncheck-swatch: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
