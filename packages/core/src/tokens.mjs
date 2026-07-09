// tokens.mjs: the locked MDP design system.
//
// This is the whole point of MDP: the design lives in the engine, not the
// source. Authors write meaning; the renderer guarantees the look. Every
// artifact (page, slides, flyer) imports these same tokens and shared rules so
// the three forms read as one designed system.
//
// Constraints encoded here (do not loosen without an ADR):
//   - Two font families: a sans for body/UI, a serif reserved for the lead and
//     quotes. The sans is selectable from a closed set of system stacks via
//     `brand-font` (FONT_STACKS); the serif role is fixed (ADR 0096). No
//     @font-face, no web fonts, so determinism and the offline guarantee hold.
//   - Two weights only (400, 500). Sentence case. No ALL CAPS except a small
//     letterspaced eyebrow.
//   - One warm neutral ramp plus ONE restrained accent. Color encodes meaning,
//     never decoration; it never colors a whole surface.
//   - No gradients, no drop shadows, no decorative anything. Hierarchy comes
//     from type size, weight, and whitespace.
//   - Light + dark via prefers-color-scheme. Motion respects
//     prefers-reduced-motion.
//
// Color is owned entirely by the engine. The author selects a named THEME (a
// vibe), never a raw color. Every theme shares the warm neutral ramp below and
// supplies one accent set, with two shades so the accent passes WCAG AA both as
// text on the background and as a fill behind near-white text. Values are
// derived from AA-checked oklch and emitted as plain hex (no dependency).

// The font, scale, spacing, and warm neutral ramp shared by every theme.
const SCALE = `  /* Type: two families only */
  --mdp-font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mdp-font-serif: Georgia, "Iowan Old Style", "Palatino Linotype", serif;

  /* Weight: two only */
  --mdp-weight-normal: 400;
  --mdp-weight-medium: 500;

  /* One modular type scale */
  --mdp-text-eyebrow: 0.78rem;
  --mdp-text-small: 0.9rem;
  --mdp-text-body: 1.0625rem;
  --mdp-text-lead: 1.375rem;
  --mdp-text-h2: 1.5rem;
  --mdp-text-title: 2.5rem;

  /* One spacing scale */
  --mdp-space-1: 0.25rem;
  --mdp-space-2: 0.5rem;
  --mdp-space-3: 0.75rem;
  --mdp-space-4: 1rem;
  --mdp-space-5: 1.5rem;
  --mdp-space-6: 2rem;
  --mdp-space-7: 3rem;
  --mdp-space-8: 4rem;
  --mdp-space-9: 6rem;

  /* Body rhythm */
  --mdp-leading-body: 1.7;
  --mdp-leading-tight: 1.2;
  --mdp-measure: 38rem;`;

// Warm neutral ramp (light): off-white bg and a warm near-black ink read more
// premium than pure #fff / #000.
const NEUTRAL_LIGHT = `  --mdp-bg: #fdfcfb;
  --mdp-surface: #f4f3f0;
  --mdp-ink: #1c1b19;
  --mdp-ink-soft: #56544f;
  --mdp-ink-faint: #8c8a83;
  --mdp-border: rgba(28, 27, 25, 0.12);`;

const NEUTRAL_DARK = `    --mdp-bg: #141413;
    --mdp-surface: #1f1e1c;
    --mdp-ink: #f4f3f1;
    --mdp-ink-soft: #a8a59f;
    --mdp-ink-faint: #75736d;
    --mdp-border: rgba(244, 243, 241, 0.14);`;

// The accent set per theme. Each entry supplies, for light and dark:
//   accent          the solid fill (near-white text on it passes AA)
//   accent-contrast the text/icon that sits on the fill
//   accent-text     the accent used as text/links on the bg (passes AA)
//   accent-surface  a subtle tinted background wash
//   accent-border   an accent edge/ring (passes 3:1 non-text)
// `mono` carries no hue: the accent collapses to the ink ramp, preserving the
// original strict black-and-white look as an explicit opt-in.
//
// The set is ordered as a spectrum (the picker reads as a color strip): the
// indigo default first, then cool to warm to berry, mono last. Every accent is
// WCAG-AA verified by scripts/check-contrast.mjs (run `npm test`): `text` clears
// 4.5:1 on the page background in both modes, and the `fill` carries near-white
// (or near-black, in dark) labels at the large-text/UI bar. Adding a theme is a
// deliberate, curated act, not a per-document choice — see the themes doc.
const ACCENTS = {
  studio: {
    light: { fill: "#5b54d6", contrast: "#ffffff", text: "#4f46d6", surface: "#eeedfb", border: "#b8b4ec" },
    dark: { fill: "#7a72e0", contrast: "#16161f", text: "#a9a3f0", surface: "#2c2a45", border: "#4d44a0" },
  },
  ocean: {
    light: { fill: "#2f6fd6", contrast: "#ffffff", text: "#2563c4", surface: "#e9f0fc", border: "#aac3ee" },
    dark: { fill: "#5a8ee6", contrast: "#0c1320", text: "#97baf0", surface: "#1b2b45", border: "#3a5f9c" },
  },
  teal: {
    light: { fill: "#2f9183", contrast: "#ffffff", text: "#1c7d72", surface: "#e6f4f1", border: "#9fd3ca" },
    dark: { fill: "#3aa597", contrast: "#0f1716", text: "#7fd6c8", surface: "#1c302d", border: "#2e6e64" },
  },
  forest: {
    light: { fill: "#2f7d46", contrast: "#ffffff", text: "#1f7038", surface: "#e6f2e9", border: "#a6d3b2" },
    dark: { fill: "#45a35f", contrast: "#0d1710", text: "#86d49a", surface: "#18301f", border: "#2f6b43" },
  },
  amber: {
    light: { fill: "#b5760f", contrast: "#ffffff", text: "#9a6212", surface: "#f6efe0", border: "#dcc18a" },
    dark: { fill: "#cf962a", contrast: "#191307", text: "#e0b665", surface: "#33270f", border: "#7e5e23" },
  },
  terracotta: {
    light: { fill: "#b05c34", contrast: "#ffffff", text: "#9c4f2b", surface: "#f6ece2", border: "#ddb295" },
    dark: { fill: "#cd7b4e", contrast: "#1c1109", text: "#e0a87f", surface: "#34241a", border: "#7e5436" },
  },
  coral: {
    light: { fill: "#cf4633", contrast: "#ffffff", text: "#c2412c", surface: "#fcece8", border: "#f0b3a6" },
    dark: { fill: "#f0735c", contrast: "#1f0f0b", text: "#f6a08e", surface: "#43221b", border: "#9c4733" },
  },
  rose: {
    light: { fill: "#d34a63", contrast: "#ffffff", text: "#c43a55", surface: "#fbeced", border: "#ecadb6" },
    dark: { fill: "#e26a80", contrast: "#1f1012", text: "#f29aa8", surface: "#43212a", border: "#9c3f50" },
  },
  plum: {
    light: { fill: "#9c3d6e", contrast: "#ffffff", text: "#92376a", surface: "#f8ebf1", border: "#dcaac4" },
    dark: { fill: "#c25c8c", contrast: "#1d0f16", text: "#e495b8", surface: "#3c2030", border: "#8a3f63" },
  },
  violet: {
    light: { fill: "#9145c8", contrast: "#ffffff", text: "#8a3ec0", surface: "#f4ecfa", border: "#d4afe6" },
    dark: { fill: "#aa63d8", contrast: "#19101f", text: "#cf9ae8", surface: "#352145", border: "#7a3fa0" },
  },
  mono: {
    light: { fill: "#1c1b19", contrast: "#fdfcfb", text: "#1c1b19", surface: "#f4f3f0", border: "#8c8a83" },
    dark: { fill: "#f4f3f1", contrast: "#141413", text: "#f4f3f1", surface: "#1f1e1c", border: "#75736d" },
  },
};

// The curated theme set. The author picks one by name; the default is `studio`.
export const THEMES = Object.keys(ACCENTS);
export const DEFAULT_THEME = "studio";

// A light-mode swatch per theme (fill / wash / text), derived from the accent
// set so a UI can show what each theme looks like without re-typing any hex.
// The source of truth stays ACCENTS; this is a read-only projection of it.
export const THEME_SWATCHES = Object.fromEntries(
  Object.entries(ACCENTS).map(([name, a]) => [
    name,
    { fill: a.light.fill, surface: a.light.surface, text: a.light.text },
  ])
);

function accentVars(a, indent) {
  return (
    `${indent}--mdp-accent: ${a.fill};\n` +
    `${indent}--mdp-accent-contrast: ${a.contrast};\n` +
    `${indent}--mdp-accent-text: ${a.text};\n` +
    `${indent}--mdp-accent-surface: ${a.surface};\n` +
    `${indent}--mdp-accent-border: ${a.border};`
  );
}

// The secondary accent: a smaller var set (fill + on-fill label + text) emitted
// only when a `brand-accent-2` is supplied. Use sites read it with a fallback to
// the primary (var(--mdp-accent2-x, var(--mdp-accent-x))), so single-color docs
// are unaffected.
function accent2Vars(a, indent) {
  return (
    `${indent}--mdp-accent2: ${a.fill};\n` +
    `${indent}--mdp-accent2-contrast: ${a.contrast};\n` +
    `${indent}--mdp-accent2-text: ${a.text};`
  );
}

// The closed set of brand fonts. `brand-font` selects one of these for the
// body/UI family only; the serif role (lead and quotes) is unchanged, so the
// two-family character is preserved. System stacks only: no @font-face and no
// network, so determinism and the offline guarantee hold, and each ends in a
// generic family so an unfamiliar system degrades gracefully. An unknown key
// falls back to the theme default (the SCALE sans).
export const FONT_STACKS = {
  system: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  serif: `Georgia, "Iowan Old Style", "Palatino Linotype", serif`,
  mono: `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`,
  rounded: `ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", system-ui, sans-serif`,
  humanist: `Optima, Candara, "Segoe UI", "Helvetica Neue", system-ui, sans-serif`,
};

// Emit the full token block for one theme: the shared scale + warm neutral ramp
// + the theme's accent set, for both light and dark. `accentOverride` (a derived
// {light,dark} set from a brand hex) replaces the named accent when present;
// `accent2Override` adds the secondary accent vars; `fontOverride` (a resolved
// FONT_STACKS value) replaces the body/UI family. All null -> byte-identical to
// the named-theme output, so existing docs are unchanged.
export function themeTokens(theme, accentOverride = null, accent2Override = null, fontOverride = null) {
  const accent = accentOverride || ACCENTS[theme] || ACCENTS[DEFAULT_THEME];
  const a2 = accent2Override;
  return (
    `:root {\n${SCALE}\n\n  /* Warm neutral ramp */\n${NEUTRAL_LIGHT}\n\n` +
    `  /* Accent (the one restrained color, in meaning-spots only) */\n${accentVars(accent.light, "  ")}` +
    (a2 ? `\n\n  /* Secondary accent (sparing, engine-placed spots) */\n${accent2Vars(a2.light, "  ")}` : "") +
    (fontOverride ? `\n\n  /* Brand font: overrides the body/UI family; the serif role is unchanged */\n  --mdp-font-sans: ${fontOverride};` : "") +
    `\n}\n\n` +
    `@media (prefers-color-scheme: dark) {\n  :root {\n${NEUTRAL_DARK}\n\n${accentVars(accent.dark, "    ")}` +
    (a2 ? `\n\n${accent2Vars(a2.dark, "    ")}` : "") +
    `\n  }\n}`
  );
}

// Shared base rules used by every artifact: reset, typography defaults, and the
// shared block primitives (eyebrow, lead, headings, lists, stats table, quote,
// hairline). Each renderer adds only its own layout shell on top.
export const BASE = `*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--mdp-bg);
  color: var(--mdp-ink);
  font-family: var(--mdp-font-sans);
  font-size: var(--mdp-text-body);
  font-weight: var(--mdp-weight-normal);
  line-height: var(--mdp-leading-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

a {
  color: var(--mdp-accent-text);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  text-decoration-thickness: 2px;
  text-decoration-color: var(--mdp-accent-text);
  transition: text-decoration-color 120ms ease;
}
a:hover { text-decoration-color: var(--mdp-accent); }

code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.92em;
  background: var(--mdp-accent-surface);
  border: 1px solid var(--mdp-accent-border);
  border-radius: 4px;
  padding: 0.08em 0.36em;
}

/* Color swatch: a small chip prepended inside a code span whose whole body is one
   color literal (see inline.mjs). The chip color rides an inline style; the border
   keeps a white or pale chip visible on the code surface in light and dark mode. */
.mdp-swatch {
  display: inline-block;
  inline-size: 0.72em;
  block-size: 0.72em;
  margin-inline-end: 0.4em;
  vertical-align: -0.06em;
  border-radius: 3px;
  border: 1px solid var(--mdp-border);
}

strong { font-weight: var(--mdp-weight-medium); }
em { font-style: italic; }

/* Eyebrow: the only letterspaced label allowed. The masthead kicker carries the
   theme accent (a meaning-spot: it names the document's category), so the chosen
   theme reads at a glance on the masthead, not only in links and buttons. */
.mdp-eyebrow {
  font-size: var(--mdp-text-eyebrow);
  font-weight: var(--mdp-weight-medium);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mdp-accent-text);
  margin: 0;
}

/* Title masthead. A short accent rule under the title echoes the kicker so the
   theme is visible even on a title slide that has no links or figures. The rule
   is a bold mark (a 4px bar), never a colored surface. */
.mdp-title {
  font-family: var(--mdp-font-sans);
  font-weight: var(--mdp-weight-medium);
  line-height: var(--mdp-leading-tight);
  letter-spacing: -0.02em;
  margin: 0;
}
.mdp-title::after {
  content: "";
  display: block;
  width: 3.5rem;
  height: 4px;
  margin-top: var(--mdp-space-4);
  border-radius: 999px;
  background: var(--mdp-accent2, var(--mdp-accent));
}
/* When a brand logo is present it already carries the masthead's brand signal,
   so drop the title's accent underline: one clean lockup instead of three
   stacked marks (logo + accent eyebrow + underline). The logo and title are
   siblings in every form's masthead (logo first), so the general sibling
   combinator targets exactly the logo case and leaves logo-less docs untouched. */
.mdp-logo ~ .mdp-title::after { display: none; }

/* Lead / standfirst: serif, softer ink */
.mdp-lead {
  font-family: var(--mdp-font-serif);
  font-weight: var(--mdp-weight-normal);
  color: var(--mdp-ink-soft);
  line-height: 1.45;
  margin: 0;
}

/* Section heading */
.mdp-h2 {
  font-family: var(--mdp-font-sans);
  font-weight: var(--mdp-weight-medium);
  font-size: var(--mdp-text-h2);
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--mdp-ink);
  margin: 0;
}

.mdp-p { margin: 0; color: var(--mdp-ink-soft); }

/* Lists */
.mdp-list { margin: 0; padding-inline-start: 1.3em; color: var(--mdp-ink-soft); }
.mdp-list li { margin: 0; padding-inline-start: 0.2em; }
.mdp-list li + li { margin-top: var(--mdp-space-2); }
.mdp-list li::marker { color: var(--mdp-accent2-text, var(--mdp-accent-text)); }

/* Stats as a clean bordered table (page form) */
.mdp-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--mdp-text-body);
}
.mdp-stats-table th,
.mdp-stats-table td {
  text-align: start;
  padding: var(--mdp-space-3) 0;
  border-bottom: 1px solid var(--mdp-border);
}
.mdp-stats-table tr:first-child th,
.mdp-stats-table tr:first-child td { border-top: 1px solid var(--mdp-border); }
.mdp-stats-table .mdp-stat-label { color: var(--mdp-ink-soft); font-weight: var(--mdp-weight-normal); }
.mdp-stats-table .mdp-stat-value {
  color: var(--mdp-ink);
  font-weight: var(--mdp-weight-medium);
  text-align: end;
  font-variant-numeric: tabular-nums;
}

/* Stat figures as a row (slides + flyer forms) */
.mdp-figures {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mdp-space-6);
}
.mdp-figure { display: flex; flex-direction: column; gap: var(--mdp-space-1); }
.mdp-figure-value {
  font-weight: var(--mdp-weight-medium);
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--mdp-accent2-text, var(--mdp-accent-text));
  font-variant-numeric: tabular-nums;
}
.mdp-figure-label {
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-faint);
}

/* Pull quote: serif, on a subtle accent wash with a bold inline-start accent
   edge so the theme color carries the quote (logical edge flips under RTL). */
.mdp-quote {
  margin: 0;
  background: var(--mdp-accent-surface);
  border-inline-start: 3px solid var(--mdp-accent);
  border-radius: 8px;
  padding: var(--mdp-space-4) var(--mdp-space-5);
}
.mdp-quote-text {
  font-family: var(--mdp-font-serif);
  font-weight: var(--mdp-weight-normal);
  color: var(--mdp-ink);
  line-height: 1.4;
  margin: 0;
}
.mdp-quote-cite {
  margin: var(--mdp-space-3) 0 0;
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-faint);
  font-style: normal;
}

/* Hairline divider */
.mdp-hr {
  border: 0;
  border-top: 1px solid var(--mdp-border);
  margin: 0;
}

/* Brand logo: an engine-placed mark in the masthead, set on a white "lockup"
   plate (padding + background + hairline border + radius + soft shadow) so a
   dark or full-color logo stays legible on every theme and in dark mode, where
   a bare mark would otherwise bleed into the surface. The author supplies only
   the asset reference; size, plate, and position are locked here. display:block
   aligns it to the inline-start edge, so a single dir=rtl flip lands it
   correctly. box-sizing:content-box keeps the height value the logo height (not
   the plate) under the global border-box reset. Per-form size overrides live in
   each renderer's stylesheet. */
.mdp-logo {
  display: block;
  box-sizing: content-box;
  height: 2rem;
  width: auto;
  max-width: 12rem;
  object-fit: contain;
  padding: var(--mdp-space-2) var(--mdp-space-3);
  background: #ffffff;
  border: 1px solid rgba(15, 18, 20, 0.1);
  border-radius: 0.625rem;
  box-shadow: 0 1px 2px rgba(15, 18, 20, 0.08), 0 6px 18px rgba(15, 18, 20, 0.06);
  margin-block-end: var(--mdp-space-5);
}

/* Body image: a paragraph that is solely an image reference, promoted to a
   block-level figure. The author names the asset; size, ratio, and position
   are locked here (mirrors .mdp-logo). Default cap fits the single-column
   reading forms (page/report/scroll/accordion/tabs/stepper/plan/memo/letter);
   per-form overrides live in each renderer's stylesheet. No physical left/
   right, so it flips for free under dir=rtl. */
.mdp-figure-img {
  margin-block: var(--mdp-space-6);
}
.mdp-figure-img img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 28rem;
  object-fit: cover;
  border-radius: 0.625rem;
  border: 1px solid var(--mdp-border);
}
`;

// Assemble the shared stylesheet (the selected theme's tokens + base) injected
// into every artifact. Defaults to the studio theme when none is given.
export function baseStyle(theme = DEFAULT_THEME, accentOverride = null, accent2Override = null, fontOverride = null) {
  return `${themeTokens(theme, accentOverride, accent2Override, fontOverride)}\n\n${BASE}`;
}
