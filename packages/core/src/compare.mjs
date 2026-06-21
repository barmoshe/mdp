// compare.mjs: the `compare` block primitive, shared across every artifact.
//
// A `compare` node lays its options out as side-by-side cards. The markup and
// CSS are identical in page, slides, and flyer (the design lock: one neutral
// ink ramp, no accent, no gradients, no shadows, two weights) so the block
// reads as one designed component wherever it appears. Each renderer only
// decides where the block sits in its own layout; the card system lives here.
//
// IR shape (from parse.mjs):
//   { type: 'compare', options: [ { name, badge, note, cta, pros: [] } ] }

import { inline } from "./inline.mjs";

// The shared compare-card stylesheet, injected by each renderer that can emit a
// compare block. Logical properties throughout, so the grid and card internals
// flip automatically under dir="rtl".
export const COMPARE_STYLE = `.mdp-compare {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--mdp-space-5);
}

.mdp-compare-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--mdp-bg);
  border: 1px solid var(--mdp-border);
  border-radius: 12px;
  padding: var(--mdp-space-5);
}

.mdp-compare-head {
  display: flex;
  align-items: center;
  gap: var(--mdp-space-3);
  margin-bottom: var(--mdp-space-3);
}
.mdp-compare-name {
  font-family: var(--mdp-font-sans);
  font-weight: var(--mdp-weight-medium);
  font-size: 1.25rem;
  line-height: var(--mdp-leading-tight);
  letter-spacing: -0.01em;
  color: var(--mdp-ink);
  margin: 0;
}
.mdp-compare-badge {
  margin-inline-start: auto;
  flex: none;
  font-size: var(--mdp-text-eyebrow);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink-soft);
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 999px;
  padding: var(--mdp-space-1) var(--mdp-space-3);
  line-height: 1.4;
  white-space: nowrap;
}

.mdp-compare-note {
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-soft);
  margin: 0 0 var(--mdp-space-4);
}

.mdp-compare-pros {
  list-style: none;
  margin: 0;
  padding: 0;
  color: var(--mdp-ink-soft);
  font-size: var(--mdp-text-small);
}
.mdp-compare-pros li {
  position: relative;
  padding-inline-start: 1.5em;
}
.mdp-compare-pros li + li { margin-top: var(--mdp-space-2); }
.mdp-compare-pros li::before {
  content: "✓";
  position: absolute;
  inset-inline-start: 0;
  color: var(--mdp-ink-faint);
  font-weight: var(--mdp-weight-medium);
}

.mdp-compare-cta {
  margin-top: auto;
  align-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--mdp-space-2);
  margin-block-start: var(--mdp-space-5);
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  background: var(--mdp-bg);
  border: 1px solid var(--mdp-border);
  border-radius: 8px;
  padding: var(--mdp-space-2) var(--mdp-space-4);
  text-decoration: none;
  transition: background 120ms ease, border-color 120ms ease;
}
.mdp-compare-cta:hover {
  background: var(--mdp-surface);
  border-color: var(--mdp-border);
  text-decoration: none;
}`;

// Render one option as a card. name/badge/note/each-pro/cta all flow through
// the inline renderer so a cta markdown link and any bold render correctly.
function renderCard(option) {
  const badge = option.badge
    ? `<span class="mdp-compare-badge">${inline(option.badge)}</span>`
    : "";
  const head =
    `<div class="mdp-compare-head">\n` +
    `<h3 class="mdp-compare-name">${inline(option.name)}</h3>` +
    (badge ? `\n${badge}` : "") +
    `\n</div>`;

  const note = option.note
    ? `\n<p class="mdp-compare-note">${inline(option.note)}</p>`
    : "";

  const pros =
    option.pros && option.pros.length
      ? `\n<ul class="mdp-compare-pros">\n` +
        option.pros.map((p) => `<li>${inline(p)}</li>`).join("\n") +
        `\n</ul>`
      : "";

  const cta = option.cta ? renderCta(option.cta) : "";

  return (
    `<div class="mdp-compare-card">\n` +
    `${head}` +
    `${note}` +
    `${pros}` +
    `${cta}\n` +
    `</div>`
  );
}

// Render the cta as a button-styled link. The author writes `[text](url)` as the
// cta value. We render it once through inline() (which escapes the label and
// defangs the url on its link path), then add the cta class to the generated
// anchor. If the value is not a single markdown link, the styled class is added
// to a wrapping span instead, so nothing is lost.
function renderCta(raw) {
  const html = inline(String(raw).trim());
  const single = html.match(/^<a href="([^"]*)">([\s\S]*)<\/a>$/);
  if (single) {
    return `\n<a class="mdp-compare-cta" href="${single[1]}">${single[2]}</a>`;
  }
  return `\n<span class="mdp-compare-cta">${html}</span>`;
}

// Render a full compare block: the responsive card grid.
export function renderCompare(block) {
  const cards = (block.options || []).map(renderCard).join("\n");
  return `<div class="mdp-compare">\n${cards}\n</div>`;
}
