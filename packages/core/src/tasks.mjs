// tasks.mjs: the `tasks` block primitive, shared across every artifact.
//
// A `tasks` node is a checklist: each item carries a status (todo / done /
// active) shown with a small box and a glyph. It is the natural primitive for an
// implementation plan, where work is a list of items in flight. The design lock
// holds: status reads through the one neutral ink ramp plus the single accent and
// a glyph (and the medium weight for the in-flight item), never a second hue. A
// done item fills its box with the accent and a check (the same accent-check
// precedent as compare's pros); an active item rings the box in the accent and
// goes medium-weight; a todo item is a hairline box and body ink. No green for
// done, no red for risk: risks belong in a :::callout, not a colored task.
//
// The markup is static and identical in every form; the `plan` form layers a
// click-to-check enhancement on top of it (see render-plan.mjs), so in a report
// or page the checklist simply reads as authored.
//
// IR shape (from parse.mjs):
//   { type: 'tasks', items: [ { status: 'todo'|'done'|'active', text } ] }

import { inline } from "./inline.mjs";

// The shared checklist stylesheet, injected by each renderer that can emit a
// tasks block. Logical properties throughout, so the row flips under dir="rtl";
// only the directional active glyph (▸) is mirrored, like the flow arrow.
export const TASKS_STYLE = `.mdp-tasks {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mdp-task {
  display: flex;
  align-items: flex-start;
  gap: var(--mdp-space-3);
  font-size: var(--mdp-text-body);
  line-height: var(--mdp-leading-body);
  color: var(--mdp-ink);
}
.mdp-task + .mdp-task { margin-top: var(--mdp-space-2); }

.mdp-task-box {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15em;
  height: 1.15em;
  margin-block-start: 0.18em;
  border: 1.5px solid var(--mdp-border);
  border-radius: 4px;
  font-size: 0.78em;
  line-height: 1;
  color: var(--mdp-accent-contrast);
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.mdp-task.is-done .mdp-task-box {
  background: var(--mdp-accent);
  border-color: var(--mdp-accent);
  color: var(--mdp-accent-contrast);
}
.mdp-task.is-active .mdp-task-box {
  border-color: var(--mdp-accent);
  color: var(--mdp-accent-text);
}

.mdp-task.is-done .mdp-task-text { color: var(--mdp-ink-faint); }
.mdp-task.is-active .mdp-task-text {
  color: var(--mdp-ink);
  font-weight: var(--mdp-weight-medium);
}

/* The status word is announced to assistive tech but never shown: status reads
   visually from the box + glyph, so the visible surface stays label-free. */
.mdp-task-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* CRITICAL: mirror the directional active glyph (▸) under RTL so it points in
   the reading direction. The check and the empty box are symmetric. */
[dir="rtl"] .mdp-task.is-active .mdp-task-box { transform: scaleX(-1); }

@media (prefers-reduced-motion: reduce) {
  .mdp-task-box { transition: none; }
}`;

const GLYPH = { done: "✓", active: "▸", todo: "" };
const STATUS_WORD = { done: "Done", active: "In progress", todo: "To do" };

// Render one task. The author text flows through the inline renderer so
// bold/italic/code/links render; the box glyph is decorative (hidden from
// assistive tech) and the status is carried by an off-screen word instead.
function renderTask(item) {
  const status =
    item.status === "done" || item.status === "active" ? item.status : "todo";
  return (
    `<li class="mdp-task is-${status}">` +
    `<span class="mdp-task-box" aria-hidden="true">${GLYPH[status]}</span>` +
    `<span class="mdp-task-text">` +
    `<span class="mdp-task-status">${STATUS_WORD[status]}: </span>` +
    `${inline(item.text)}</span>` +
    `</li>`
  );
}

// Render a full tasks block: a semantic checklist. role="list" keeps the list
// semantics when list-style is removed (Safari).
export function renderTasks(block) {
  const items = (block.items || []).map(renderTask).join("\n");
  return `<ul class="mdp-tasks" role="list">\n${items}\n</ul>`;
}
