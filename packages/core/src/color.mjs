// color.mjs: the engine's only color math. Pure, dependency-free, deterministic
// (no Date / Math.random / I/O), so a source compiles byte-identical everywhere.
//
// Two jobs live here, deliberately kept to one file so they cannot drift apart:
//
//   1. The WCAG AA oracle (relativeLuminance / contrast / thresholds). This is a
//      verbatim port of the math that used to live, unexported, inside
//      scripts/check-contrast.mjs — now lifted into the engine so the build-time
//      gate and the render-time derivation use the SAME formula on hex strings.
//
//   2. deriveAccent / deriveAccent2: turn one brand hex into a full accent set
//      (the 5 roles fill/contrast/text/surface/border) for both light and dark,
//      each role gated to AA, with the whole thing failing closed (-> null) when
//      a color cannot be made accessible, so the caller falls back to a named
//      theme. The author picks a color; the engine still owns every role.
//
// Color is interpreted through OKLCh (perceptual lightness + chroma + hue) so a
// brand color can be re-lit for light and dark mode while keeping its hue. The
// OKLab matrices are Björn Ottosson's (https://bottosson.github.io/posts/oklab/);
// the inverse chain mirrors the palette-oklch tool the workshop already ships.

// --- sRGB hex <-> integer channels ---------------------------------------------

// "#rrggbb" -> [r, g, b] as integers 0..255. Assumes an already-validated hex.
export function hexToRgb(hex) {
  const m = String(hex).trim().replace("#", "");
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16));
}

// [r, g, b] (any reals) -> "#rrggbb", rounded and clamped to the byte range.
export function rgbToHex([r, g, b]) {
  const h = (v) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// --- sRGB gamma transfer (the standard pair, used only for OKLab conversion) ---

export function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v));
}

// --- OKLab / OKLCh (forward + inverse) -----------------------------------------

export function linearRgbToOklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklabToLinearRgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklabToOklch({ L, a, b }) {
  const C = Math.hypot(a, b);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { L, C, h };
}

export function oklchToOklab({ L, C, h }) {
  const rad = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

export function hexToOklch(hex) {
  const linear = hexToRgb(hex).map((c) => srgbToLinear(c / 255));
  return oklabToOklch(linearRgbToOklab(linear));
}

export function oklchToHex({ L, C, h }) {
  const rgb = oklabToLinearRgb(oklchToOklab({ L, C, h })).map(
    (c) => linearToSrgb(c) * 255
  );
  return rgbToHex(rgb);
}

// --- WCAG AA oracle (verbatim port of the old check-contrast.mjs math) ----------

const wcagChannel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * wcagChannel(r) + 0.7152 * wcagChannel(g) + 0.0722 * wcagChannel(b);
}

// Contrast ratio between two hex colors, >= 1. Identical formula to the gate.
export function contrast(a, b) {
  const la = relativeLuminance(a) + 0.05;
  const lb = relativeLuminance(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

export const TEXT_MIN = 4.5; // AA, normal text (accent-text on background)
export const FILL_MIN = 3.0; // AA, large text / UI component (contrast on fill)

// --- accent derivation ----------------------------------------------------------

// The neutral backgrounds the gate runs against (must match tokens.mjs NEUTRAL_*).
const LIGHT_BG = "#fdfcfb";
const DARK_BG = "#141413";
// On-fill label candidates: near-white and the studio near-black ink.
const ON_LIGHT = "#ffffff";
const ON_DARK = "#16161f";

const MAX_CHROMA = 0.16; // cap neon input so derived roles stay in gamut
const STEP = 0.02; // lightness step when nudging toward AA
const MAX_ITERS = 26; // bounded loop -> deterministic, no while(true)

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const roleHex = (L, C, h) => oklchToHex({ L: clamp(L, 0, 1), C: Math.max(0, C), h });

// A text/label color of hue `h` that clears TEXT_MIN against `bg`. Steps L toward
// more contrast (darker in light mode, lighter in dark mode) until it passes.
function deriveTextRole(h, C, bg, startL, dir) {
  let L = startL;
  for (let i = 0; i < MAX_ITERS; i++) {
    const hex = roleHex(L, C, h);
    if (contrast(hex, bg) >= TEXT_MIN) return hex;
    L += dir * STEP;
    if (L <= 0.02 || L >= 0.98) break;
  }
  const hex = roleHex(clamp(L, 0.04, 0.96), C, h);
  return contrast(hex, bg) >= TEXT_MIN ? hex : null;
}

// A solid fill of hue `h` plus the on-fill label (whichever of near-white /
// near-black scores higher) that together clear FILL_MIN. If they don't, nudge
// the fill toward the chosen extreme. The picker is the #FFCC00 fix: a luminous
// fill auto-takes the dark label instead of an unreadable white one.
function deriveFillRole(h, C, startL) {
  let L = startL;
  for (let i = 0; i < MAX_ITERS; i++) {
    const fill = roleHex(L, C, h);
    const label = contrast(ON_LIGHT, fill) >= contrast(ON_DARK, fill) ? ON_LIGHT : ON_DARK;
    if (contrast(label, fill) >= FILL_MIN) return { fill, contrast: label };
    L += label === ON_LIGHT ? -STEP : STEP; // too light -> darken; too dark -> lighten
    if (L <= 0.02 || L >= 0.98) break;
  }
  return null;
}

// Build the 5 roles for one mode. Primary mirrors the named-theme structure (a
// mid/dark fill in light, a brighter fill in dark) so derived themes feel native.
function buildPrimaryMode(h, C, mode) {
  const light = mode === "light";
  const fill = deriveFillRole(h, C, light ? 0.5 : 0.62);
  if (!fill) return null;
  const text = deriveTextRole(h, C, light ? LIGHT_BG : DARK_BG, light ? 0.45 : 0.74, light ? -1 : 1);
  if (!text) return null;
  return {
    fill: fill.fill,
    contrast: fill.contrast,
    text,
    surface: roleHex(light ? 0.96 : 0.2, Math.min(C, 0.05), h),
    border: roleHex(light ? 0.86 : 0.42, Math.min(C, 0.08), h),
  };
}

// Derive a full primary accent set from a validated hex, or null if any gated
// role cannot reach AA within bounds (caller then falls back to a named theme).
export function deriveAccent(hex) {
  const { C, h } = hexToOklch(hex);
  const c = Math.min(C, MAX_CHROMA);
  const light = buildPrimaryMode(h, c, "light");
  const dark = buildPrimaryMode(h, c, "dark");
  return light && dark ? { light, dark } : null;
}

// Secondary accent: a smaller set (fill + on-fill label + text) used only in
// engine-chosen graphic spots. The fill stays near the brand's own lightness so
// a vivid secondary (e.g. brand yellow) reads vivid, not muddied.
function buildSecondaryMode(h, C, brandL, mode) {
  const light = mode === "light";
  const fill = deriveFillRole(h, C, clamp(brandL, 0.55, 0.82));
  if (!fill) return null;
  const text = deriveTextRole(h, C, light ? LIGHT_BG : DARK_BG, light ? 0.45 : 0.74, light ? -1 : 1);
  if (!text) return null;
  return { fill: fill.fill, contrast: fill.contrast, text };
}

export function deriveAccent2(hex) {
  const { L, C, h } = hexToOklch(hex);
  const c = Math.min(C, MAX_CHROMA);
  const light = buildSecondaryMode(h, c, L, "light");
  const dark = buildSecondaryMode(h, c, L, "dark");
  return light && dark ? { light, dark } : null;
}
