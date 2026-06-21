// tokens.mjs: the locked MDP "studio" design system.
//
// This is the whole point of MDP: the design lives in the engine, not the
// source. Authors write meaning; the renderer guarantees the look. Every
// artifact (page, slides, flyer) imports these same tokens and shared rules so
// the three forms read as one designed system.
//
// Constraints encoded here (do not loosen without an ADR):
//   - Two font families only: a system sans for body/UI, a serif reserved for
//     the lead and quotes.
//   - Two weights only (400, 500). Sentence case. No ALL CAPS except a small
//     letterspaced eyebrow.
//   - One neutral ink ramp. No second accent colour. Monochrome and premium.
//   - No gradients, no drop shadows, no decorative anything. Hierarchy comes
//     from type size, weight, and whitespace.
//   - Light + dark via prefers-color-scheme. Motion respects
//     prefers-reduced-motion.

// The design tokens as CSS custom properties, plus the light/dark ramps.
export const TOKENS = `:root {
  /* Type: two families only */
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
  --mdp-measure: 38rem;

  /* Light ramp (default): one neutral ink ramp, no accent */
  --mdp-bg: #ffffff;
  --mdp-surface: #f6f6f3;
  --mdp-ink: #18181b;
  --mdp-ink-soft: #52525b;
  --mdp-ink-faint: #8a8a8f;
  --mdp-border: rgba(0, 0, 0, 0.10);
}

@media (prefers-color-scheme: dark) {
  :root {
    --mdp-bg: #0f0f10;
    --mdp-surface: #1a1a1c;
    --mdp-ink: #f4f4f5;
    --mdp-ink-soft: #a1a1aa;
    --mdp-ink-faint: #71717a;
    --mdp-border: rgba(255, 255, 255, 0.12);
  }
}`;

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
  color: var(--mdp-ink);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--mdp-border);
  transition: text-decoration-color 120ms ease;
}
a:hover { text-decoration-color: var(--mdp-ink); }

code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.92em;
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 4px;
  padding: 0.08em 0.36em;
}

strong { font-weight: var(--mdp-weight-medium); }
em { font-style: italic; }

/* Eyebrow: the only letterspaced, faint label allowed. Sentence-ish. */
.mdp-eyebrow {
  font-size: var(--mdp-text-eyebrow);
  font-weight: var(--mdp-weight-medium);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mdp-ink-faint);
  margin: 0;
}

/* Title masthead */
.mdp-title {
  font-family: var(--mdp-font-sans);
  font-weight: var(--mdp-weight-medium);
  line-height: var(--mdp-leading-tight);
  letter-spacing: -0.02em;
  margin: 0;
}

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
.mdp-list li::marker { color: var(--mdp-ink-faint); }

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
  color: var(--mdp-ink);
  font-variant-numeric: tabular-nums;
}
.mdp-figure-label {
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-faint);
}

/* Pull quote: serif, inline-start hairline border */
.mdp-quote {
  margin: 0;
  border-inline-start: 2px solid var(--mdp-border);
  padding-inline-start: var(--mdp-space-5);
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
`;

// Assemble the shared stylesheet (tokens + base) injected into every artifact.
export function baseStyle() {
  return `${TOKENS}\n\n${BASE}`;
}
