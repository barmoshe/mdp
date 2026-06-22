// check-contrast.mjs: WCAG-AA conformance guard for the theme set.
//
// MDP's whole promise is that the engine owns the look, so the look must be
// accessible by construction — not by the author's care. This test compiles the
// real token CSS for every theme (the same bytes that ship in every artifact),
// reads the emitted custom properties back out, and asserts the two contrast
// guarantees the design system makes:
//
//   1. --mdp-accent-text on --mdp-bg clears 4.5:1 (AA for normal-size text),
//      in BOTH light and dark. This is the accent used for links and labels.
//   2. near-white/near-black --mdp-accent-contrast on the solid --mdp-accent
//      fill clears 3:1 (AA for large text / UI components). The fill carries
//      stat figures, the compare button, and the active slide dot.
//
// Border and surface are reported for review but not gated: the border is a
// decorative hairline and the surface is a deliberately subtle wash.
//
// Run: npm test   (from the repo root)

// The WCAG oracle (contrast + the AA thresholds) now lives in the engine
// (packages/core/src/color.mjs) so this gate and the render-time brand-accent
// derivation use the exact same math. Imported here, not redefined.
import { THEMES, themeTokens, contrast, TEXT_MIN, FILL_MIN } from "../packages/core/src/index.mjs";

// Pull the resolved hex of one custom property out of a CSS chunk.
const readVar = (css, name) => {
  const m = css.match(new RegExp(`--mdp-${name}:\\s*(#[0-9a-fA-F]{6})`));
  return m ? m[1] : null;
};

// themeTokens emits `:root { ...light... }` then an `@media (prefers-color-scheme:
// dark)` block. Split there to read each mode's resolved values.
const modes = (theme) => {
  const css = themeTokens(theme);
  const at = css.indexOf("@media (prefers-color-scheme: dark)");
  const light = css.slice(0, at);
  const dark = css.slice(at);
  const grab = (chunk) => ({
    bg: readVar(chunk, "bg"),
    fill: readVar(chunk, "accent"),
    contrast: readVar(chunk, "accent-contrast"),
    text: readVar(chunk, "accent-text"),
    surface: readVar(chunk, "accent-surface"),
    border: readVar(chunk, "accent-border"),
  });
  return { light: grab(light), dark: grab(dark) };
};

const f = (n) => n.toFixed(2);

let failures = 0;
console.log(`Checking ${THEMES.length} themes for WCAG-AA contrast\n`);

for (const theme of THEMES) {
  const m = modes(theme);
  for (const mode of ["light", "dark"]) {
    const v = m[mode];
    const cText = contrast(v.text, v.bg);
    const cFill = contrast(v.fill, v.contrast);
    const cBorder = contrast(v.border, v.bg);
    const cSurface = contrast(v.surface, v.bg);
    const problems = [];
    if (cText < TEXT_MIN) problems.push(`text ${f(cText)} < ${TEXT_MIN}`);
    if (cFill < FILL_MIN) problems.push(`fill ${f(cFill)} < ${FILL_MIN}`);
    const tag = problems.length ? "FAIL" : "ok  ";
    if (problems.length) failures++;
    console.log(
      `  ${tag} ${theme}/${mode}: text=${f(cText)} fill=${f(cFill)} ` +
        `(border=${f(cBorder)} surface=${f(cSurface)})` +
        (problems.length ? `  << ${problems.join(", ")}` : "")
    );
  }
}

if (failures) {
  console.error(`\n${failures} contrast failure(s). Tune the accent set in packages/core/src/tokens.mjs.`);
  process.exit(1);
}
console.log(`\nAll ${THEMES.length} themes pass AA in light and dark.`);
