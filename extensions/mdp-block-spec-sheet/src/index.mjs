// mdp-block-spec-sheet: an MDP block extension that renders a compact spec sheet,
// a titled list of key/value pairs (display, weight, battery, ...) as a definition
// list laid out in two aligned columns.
//
// Shape mirrors mdp-compiler's own block modules: export a STYLE string and a
// render<Name>(block) returning an HTML string. A block is normally RENDER-ONLY
// (the host parses the fence into the IR node), but a spec sheet has a tiny, well
// defined body grammar, so this package also exports `parseSpecSheet(body)` as a
// convenience a host may reuse. Every author string flows through inline().
//
// IR node this renderer expects:
//   { type: "spec-sheet", title?: string, rows: [ { key, value }, ... ] }

import { inline } from "./_inline.mjs";

// The block's stylesheet, injected once by each host renderer that emits it.
// Tokens only (var(--mdp-*)); logical properties so it flips under dir="rtl".
export const SPEC_SHEET_STYLE = `.mdp-spec-sheet {
  margin: 0;
  border: 1px solid var(--mdp-border);
  border-radius: 12px;
  overflow: hidden;
}

.mdp-spec-sheet-title {
  margin: 0;
  background: var(--mdp-surface);
  border-bottom: 1px solid var(--mdp-border);
  padding-block: var(--mdp-space-2);
  padding-inline: var(--mdp-space-4);
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink-soft);
}

.mdp-spec-sheet-rows {
  display: grid;
  grid-template-columns: minmax(7rem, max-content) 1fr;
  margin: 0;
}

.mdp-spec-sheet-key,
.mdp-spec-sheet-val {
  border-top: 1px solid var(--mdp-border);
  padding-block: var(--mdp-space-2);
  padding-inline: var(--mdp-space-4);
  font-size: var(--mdp-text-small);
  line-height: var(--mdp-leading-tight);
}

.mdp-spec-sheet-key { color: var(--mdp-ink-soft); }
.mdp-spec-sheet-val { color: var(--mdp-ink); }

/* The first key/value pair sits flush against the title bar or the box edge. */
.mdp-spec-sheet-rows > :nth-child(1),
.mdp-spec-sheet-rows > :nth-child(2) { border-top: 0; }`;

// Parse a fenced body into the IR node. Each non-empty line is `key: value`; a
// `title:` line sets the sheet title; a line with no colon becomes a key with an
// empty value. Pure and deterministic. A host may use this or its own parser.
export function parseSpecSheet(body) {
  const rows = [];
  let title;
  for (const raw of String(body == null ? "" : body).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i === -1) {
      rows.push({ key: line, value: "" });
      continue;
    }
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key.toLowerCase() === "title") {
      title = value;
      continue;
    }
    rows.push({ key, value });
  }
  return title ? { type: "spec-sheet", title, rows } : { type: "spec-sheet", rows };
}

// Render one spec-sheet block. Pure and deterministic (no clocks, no randomness,
// stable order), so two renders of the same node are byte-identical.
export function renderSpecSheet(block) {
  const rows = (block && block.rows) || [];
  const title =
    block && block.title
      ? `<p class="mdp-spec-sheet-title">${inline(block.title)}</p>\n`
      : "";
  const body = rows
    .map((r) => {
      const key = r && r.key != null ? r.key : "";
      const value = r && r.value != null ? r.value : "";
      return `<dt class="mdp-spec-sheet-key">${inline(key)}</dt><dd class="mdp-spec-sheet-val">${inline(value)}</dd>`;
    })
    .join("\n");
  return `<div class="mdp-spec-sheet">\n${title}<dl class="mdp-spec-sheet-rows">\n${body}\n</dl>\n</div>`;
}
