// callout.mjs: the `callout` block primitive, shared across every artifact.
//
// A `callout` node is a bordered aside that lifts a short passage out of the
// flow: a note, a tip, a cost caveat, a recommendation, a warning. The markup
// and CSS are identical in page, slides, and flyer (the design lock: one
// neutral ink ramp, no accent, no gradients, no shadows, two weights) so the
// box reads as one designed component wherever it appears.
//
// Emphasis is carried WITHOUT colour. Two levels:
//   - key boxes    (recommendation, warning): a strong inline-start rule
//                  (3px solid ink) and full-ink body text.
//   - calm boxes   (note, tip, cost): a normal hairline border all round and
//                  softer ink body text.
// The semantic variant always stays in the markup as a modifier class
// (mdp-callout--<variant>) so a future theme can style it; no English label
// text is ever injected.
//
// IR shape (from parse.mjs):
//   { type: 'callout', variant, blocks: [ { type: 'paragraph', text } ... ] }

import { inline } from "./inline.mjs";

// The closed set of variants and which emphasis level each maps to. An unknown
// or missing variant resolves to "note" (the calmest level) in the parser.
export const CALLOUT_VARIANTS = ["note", "tip", "cost", "recommendation", "warning"];
const KEY_VARIANTS = new Set(["recommendation", "warning"]);

// True for the strongly-emphasised variants (the key boxes).
export function isKeyCallout(variant) {
  return KEY_VARIANTS.has(variant);
}

// The shared callout stylesheet, injected by each renderer that can emit a
// callout block. Logical properties throughout, so the box and its inline-start
// accent flip automatically under dir="rtl".
export const CALLOUT_STYLE = `.mdp-callout {
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 12px;
  padding: var(--mdp-space-5);
  /* Calm default: a normal hairline accent on the inline-start edge. */
  border-inline-start: 1px solid var(--mdp-border);
}
.mdp-callout > * { margin: 0; }
.mdp-callout > * + * { margin-top: var(--mdp-space-3); }

.mdp-callout-p {
  color: var(--mdp-ink-soft);
  line-height: var(--mdp-leading-body);
}

/* Recommendation: the accent box. A tinted surface and an accent edge mark it
   as the positive takeaway, the one callout that earns color. */
.mdp-callout--recommendation {
  background: var(--mdp-accent-surface);
  border-color: var(--mdp-accent-border);
  border-inline-start: 3px solid var(--mdp-accent);
}
.mdp-callout--recommendation .mdp-callout-p { color: var(--mdp-ink); }

/* Warning: a strong neutral edge and full-ink body, so it reads distinct from
   the accent recommendation without competing for color. */
.mdp-callout--warning {
  border-inline-start: 3px solid var(--mdp-ink);
}
.mdp-callout--warning .mdp-callout-p { color: var(--mdp-ink); }`;

// Render one callout block: the box plus its inner paragraphs. Every paragraph
// runs through the inline renderer so bold/italic/code/links render. The
// variant rides along as a modifier class; nothing is added to the visible text.
export function renderCallout(block) {
  const variant = block.variant || "note";
  const paras = (block.blocks || [])
    .filter((b) => b.type === "paragraph" && b.text)
    .map((b) => `<p class="mdp-callout-p">${inline(b.text)}</p>`)
    .join("\n");
  return `<div class="mdp-callout mdp-callout--${variant}">\n${paras}\n</div>`;
}
