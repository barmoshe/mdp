// timeline.mjs: the `timeline` block primitive, shared across every artifact.
//
// A `timeline` node is a vertical sequence of steps, each a short title and body
// (distinct from the horizontal `mdp:flow` chips). It reads as one designed
// component in every form (the design lock): a single accent rail with a dot per
// step, hierarchy from type and weight, no gradients or shadows. Logical
// properties throughout, so the rail and dots flip under dir="rtl". Pure CSS.
//
// IR shape (from parse.mjs):
//   { type: 'timeline', steps: [ { title, body } ] }

import { inline } from "./inline.mjs";

// The shared timeline stylesheet, injected by each renderer that can emit a
// timeline. The rail is the list's inline-start border; each step carries a dot
// on that rail via a pseudo-element placed with logical offsets.
export const TIMELINE_STYLE = `.mdp-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  padding-inline-start: var(--mdp-space-5);
  border-inline-start: 2px solid var(--mdp-border);
  display: flex;
  flex-direction: column;
  gap: var(--mdp-space-5);
}
.mdp-timeline-step { position: relative; }
.mdp-timeline-step::before {
  content: "";
  position: absolute;
  inset-inline-start: calc(-1 * var(--mdp-space-5) - 4px);
  inset-block-start: 0.3em;
  inline-size: 9px;
  block-size: 9px;
  border-radius: 50%;
  background: var(--mdp-accent);
}
.mdp-timeline-title {
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  line-height: var(--mdp-leading-tight);
}
.mdp-timeline-body {
  margin-block-start: var(--mdp-space-1);
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-soft);
}`;

// Render a timeline block: an ordered list of steps. Title and body flow through
// inline() so bold/italic/code/links render. A step with no body renders just its
// title (the body div is omitted), so a sparse timeline still reads cleanly.
export function renderTimeline(block) {
  const steps = (block.steps || [])
    .map((s) => {
      const body = s.body ? `\n<div class="mdp-timeline-body">${inline(s.body)}</div>` : "";
      return (
        `<li class="mdp-timeline-step">\n` +
        `<div class="mdp-timeline-title">${inline(s.title)}</div>${body}\n` +
        `</li>`
      );
    })
    .join("\n");
  return `<ol class="mdp-timeline">\n${steps}\n</ol>`;
}
