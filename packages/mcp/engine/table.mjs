// table.mjs: the `table` block primitive, shared across every artifact.
//
// A `table` node is a semantic data table written in GitHub-flavored pipe syntax.
// The engine owns the look (bordered rows, tabular numerals, token colors); the
// author supplies only the cells and an optional per-column alignment taken from
// the delimiter row. Alignment is stored as a LOGICAL keyword (start/end/center)
// and applied with `text-align`, so an end-aligned column flips under dir="rtl"
// automatically. Pure HTML table + token CSS: no JS, no dependency.
//
// IR shape (from parse.mjs):
//   { type: 'table', align: ['start'|'end'|'center', ...], header: [..], rows: [[..], ..] }

import { inline } from "./inline.mjs";

// The shared table stylesheet, injected by each renderer that can emit a table.
// Logical padding/alignment throughout so the table reads correctly in both
// directions; the header row and body share one hairline ramp.
export const TABLE_STYLE = `.mdp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--mdp-text-small);
  font-variant-numeric: tabular-nums;
}
.mdp-table th,
.mdp-table td {
  padding: var(--mdp-space-3) var(--mdp-space-4);
  border-bottom: 1px solid var(--mdp-border);
  text-align: start;
  vertical-align: top;
}
.mdp-table th:first-child,
.mdp-table td:first-child { padding-inline-start: 0; }
.mdp-table th:last-child,
.mdp-table td:last-child { padding-inline-end: 0; }
.mdp-table thead th {
  color: var(--mdp-ink);
  font-weight: var(--mdp-weight-medium);
}
.mdp-table tbody td { color: var(--mdp-ink-soft); }
.mdp-table .is-end { text-align: end; }
.mdp-table .is-center { text-align: center; }`;

// Map a column index to its alignment class attribute (empty for the default
// start alignment, so a plain table emits no alignment classes at all).
function alignAttr(align, i) {
  const a = align && align[i];
  if (a === "end") return ' class="is-end"';
  if (a === "center") return ' class="is-center"';
  return "";
}

// Render a table block: a thead from the header row, a tbody from the data rows.
// Every cell flows through inline() so bold/italic/code/links render and the text
// is escaped. Alignment classes come from the parsed delimiter row.
export function renderTable(block) {
  const align = block.align || [];
  const header = block.header || [];
  const rows = block.rows || [];

  const head =
    `<thead>\n<tr>` +
    header.map((c, i) => `<th${alignAttr(align, i)} scope="col">${inline(c)}</th>`).join("") +
    `</tr>\n</thead>`;

  const body =
    `<tbody>\n` +
    rows
      .map(
        (row) =>
          `<tr>` +
          row.map((c, i) => `<td${alignAttr(align, i)}>${inline(c)}</td>`).join("") +
          `</tr>`
      )
      .join("\n") +
    `\n</tbody>`;

  return `<table class="mdp-table">\n${head}\n${body}\n</table>`;
}
