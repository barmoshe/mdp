// faq.mjs: the `faq` block primitive, shared across every artifact.
//
// A `faq` node is a list of question/answer pairs rendered as native
// <details>/<summary> disclosures: keyboard-accessible and collapsible on the
// interactive forms (page, slides), with NO script. Each item is `open` by
// default so the answers are visible on the static and print forms (flyer,
// report, memo, letter, one-pager) where there is no one to click; on page and
// slides a reader can still collapse them. Pure HTML + token CSS, deterministic.
//
// IR shape (from parse.mjs):
//   { type: 'faq', items: [ { q, a } ] }

import { inline } from "./inline.mjs";

// The shared faq stylesheet. The default disclosure marker is replaced with a
// token-coloured +/- affordance that flips with the [open] state. Logical
// properties throughout so it reads correctly under dir="rtl".
export const FAQ_STYLE = `.mdp-faq {
  display: flex;
  flex-direction: column;
  gap: var(--mdp-space-3);
}
.mdp-faq-item {
  border: 1px solid var(--mdp-border);
  border-radius: 8px;
  padding: var(--mdp-space-3) var(--mdp-space-4);
}
.mdp-faq-q {
  display: flex;
  align-items: baseline;
  gap: var(--mdp-space-3);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  cursor: pointer;
  list-style: none;
}
.mdp-faq-q::-webkit-details-marker { display: none; }
.mdp-faq-q::before {
  content: "+";
  flex: none;
  inline-size: 1em;
  color: var(--mdp-accent-text);
  font-weight: var(--mdp-weight-medium);
}
.mdp-faq-item[open] .mdp-faq-q::before { content: "−"; }
.mdp-faq-a {
  margin-block-start: var(--mdp-space-2);
  padding-inline-start: calc(1em + var(--mdp-space-3));
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-soft);
}
.mdp-faq-q:focus-visible {
  outline: 2px solid var(--mdp-accent-border);
  outline-offset: 2px;
  border-radius: 4px;
}`;

// Render a faq block: one <details open> per pair. Question and answer flow
// through inline() so marks render and the text is escaped. An item with no
// answer renders just its question.
export function renderFaq(block) {
  const items = (block.items || [])
    .map((it) => {
      const a = it.a ? `\n<div class="mdp-faq-a">${inline(it.a)}</div>` : "";
      return (
        `<details class="mdp-faq-item" open>\n` +
        `<summary class="mdp-faq-q">${inline(it.q)}</summary>${a}\n` +
        `</details>`
      );
    })
    .join("\n");
  return `<div class="mdp-faq">\n${items}\n</div>`;
}
