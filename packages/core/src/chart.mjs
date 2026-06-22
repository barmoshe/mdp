// chart.mjs: the `chart` block primitive, shared across every artifact.
//
// A `chart` node is a horizontal bar chart written as `label: value` pairs — the
// visual sibling of `stats` (same input), but each value becomes a proportional
// bar so magnitudes read at a glance. Pure CSS: every bar is one element whose
// inline-size is a percentage the ENGINE computes from the data. That width is the
// one engine-computed layout value; the author never sets a size, so the design
// lock holds. Bars use logical inline-size, so they grow from the inline-start
// edge and flip correctly under dir="rtl". No SVG, no JS, no dependency.
//
// IR shape (from parse.mjs):
//   { type: 'chart', items: [ { label, value } ] }   // value is a number

import { inline } from "./inline.mjs";

// The shared chart stylesheet, injected by each renderer that can emit a chart.
// A three-column grid (label / bar track / value) keeps every row aligned. The
// dl/dt/dd carry the meaning; the track is decorative (aria-hidden), so a screen
// reader reads each label and its value as text.
export const CHART_STYLE = `.mdp-chart {
  display: grid;
  grid-template-columns: minmax(5rem, max-content) 1fr minmax(2.5rem, max-content);
  align-items: center;
  gap: var(--mdp-space-2) var(--mdp-space-4);
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.mdp-chart dt, .mdp-chart dd { margin: 0; }

.mdp-chart-label {
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-soft);
  line-height: var(--mdp-leading-tight);
}

.mdp-chart-track {
  block-size: 0.6rem;
  background: var(--mdp-surface);
  border-radius: 999px;
  overflow: hidden;
}
.mdp-chart-bar {
  display: block;
  block-size: 100%;
  min-inline-size: 2px;
  background: var(--mdp-accent);
  border-radius: 999px;
}

.mdp-chart-value {
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  text-align: end;
}`;

// Render a chart block: a label / bar / value grid. Each bar width is value / max
// as a percentage, rounded to two decimals so the markup is byte-stable run to
// run. A non-positive max (all zeros or negatives) yields zero-width bars while
// the labels and values still render, so the data is never lost.
export function renderChart(block) {
  const items = block.items || [];
  const max = items.reduce((m, it) => (it.value > m ? it.value : m), 0);
  const rows = items
    .map((it) => {
      const pct = max > 0 && it.value > 0 ? ((it.value / max) * 100).toFixed(2) : "0";
      return (
        `<dt class="mdp-chart-label">${inline(it.label)}</dt>` +
        `<dd class="mdp-chart-track" aria-hidden="true"><span class="mdp-chart-bar" style="inline-size:${pct}%"></span></dd>` +
        `<dd class="mdp-chart-value">${inline(String(it.value))}</dd>`
      );
    })
    .join("\n");
  return `<dl class="mdp-chart">\n${rows}\n</dl>`;
}
