// flow.mjs: the `flow` block primitive, shared across every artifact.
//
// A `flow` node is a left-to-right sequence of steps shown as bordered chips
// joined by arrow connectors: "A -> B -> C". It reads as one designed component
// in page, slides, and flyer (the design lock: one neutral ink ramp, no accent,
// no gradients, no shadows, two weights).
//
// RTL is handled with logical CSS plus one transform: the flex row itself flips
// with dir, and the arrow glyph is mirrored under dir="rtl" so it points in the
// reading direction (→ becomes ←). The author never positions anything.
//
// IR shape (from parse.mjs):
//   { type: 'flow', steps: [ '...', '...' ] }

import { inline } from "./inline.mjs";

// The shared flow stylesheet, injected by each renderer that can emit a flow
// block. The row wraps gracefully on narrow widths.
export const FLOW_STYLE = `.mdp-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mdp-space-3);
  margin: 0;
}

.mdp-flow-step {
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 8px;
  padding: var(--mdp-space-2) var(--mdp-space-4);
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-soft);
  line-height: var(--mdp-leading-tight);
}

.mdp-flow-arrow {
  display: inline-block;
  color: var(--mdp-ink-faint);
  font-size: var(--mdp-text-small);
  line-height: 1;
  user-select: none;
}

/* CRITICAL: mirror the arrow under RTL so it points in the reading direction
   (→ reads as ←). The flex row flips on its own with dir. */
[dir="rtl"] .mdp-flow-arrow { transform: scaleX(-1); }`;

// Render one flow block: chips joined by mirror-able arrow connectors. Each step
// runs through the inline renderer so bold/italic/code/links render. The arrow
// is decorative, so it is hidden from assistive tech.
export function renderFlow(block) {
  const steps = block.steps || [];
  const parts = [];
  steps.forEach((step, i) => {
    if (i > 0) {
      parts.push(`<span class="mdp-flow-arrow" aria-hidden="true">→</span>`);
    }
    parts.push(`<span class="mdp-flow-step">${inline(step)}</span>`);
  });
  return `<div class="mdp-flow">\n${parts.join("\n")}\n</div>`;
}
