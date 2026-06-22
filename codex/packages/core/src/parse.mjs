// parse.mjs: MDP source string to the intermediate representation (IR).
//
// The IR is the semantic representation every artifact solves against:
//   { meta, blocks }
//     meta  : the frontmatter (mdp, theme, forms, title)
//     blocks: a flat, ordered array of typed nodes
//
// Node types this parser emits (exactly what the v1 spec + tidewater.mdp use):
//   { type: 'title',     text }
//   { type: 'lead',      text }
//   { type: 'break' }                              // a thematic `---`
//   { type: 'heading',   level: 2, text }
//   { type: 'list',      ordered: bool, items: [] }
//   { type: 'stats',     items: [{ label, value }] }
//   { type: 'compare',   options: [{ name, badge, note, cta, pros: [] }] }
//   { type: 'flow',      steps: [] }
//   { type: 'callout',   variant, blocks: [{ type:'paragraph', text } ...] }
//   { type: 'quote',     text, cite }
//   { type: 'paragraph', text }
//
// This is a hand-written line scanner, not a full CommonMark parser: it handles
// the locked block set and degrades unknown directives to readable text (the
// "wrong input still renders" principle). No dependencies.

import { CALLOUT_VARIANTS } from "./callout.mjs";
import { DIAGRAM_KINDS } from "./diagram.mjs";

// Split a `[a, b, c]` inline array into trimmed string parts.
function parseInlineArray(raw) {
  return raw
    .slice(1, -1)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Coerce a scalar frontmatter value: inline array, integer, or bare string.
function parseScalar(raw) {
  const value = raw.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    return parseInlineArray(value);
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}

// Parse the leading `---` ... `---` frontmatter into a plain object. Returns
// { meta, rest } where rest is the body after the closing fence. If there is no
// frontmatter, meta is {} and rest is the whole input.
export function parseFrontmatter(source) {
  const lines = source.split("\n");
  if (lines[0].trim() !== "---") {
    return { meta: {}, rest: source };
  }
  const meta = {};
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      i++;
      break;
    }
    const line = lines[i];
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1);
    if (key) meta[key] = parseScalar(value);
  }
  return { meta, rest: lines.slice(i).join("\n") };
}

// Parse the body of a `mdp:compare` fenced block into option records.
// Deterministic line scanner over the already-extracted fence body:
//   `# <text>`       starts a new option named <text>
//   `badge: <text>`  sets badge on the current option
//   `note: <text>`   sets note on the current option
//   `cta: <text>`    sets cta on the current option
//   `- <text>`       appends a pro to the current option
// Blank lines are ignored. Fields seen before any `#` are dropped (no option to
// attach them to), so a malformed body still yields readable options or none.
function parseCompareBody(bodyLines) {
  const options = [];
  let current = null;
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (line === "") continue;

    const head = line.match(/^#\s+(.*)$/);
    if (head) {
      current = { name: head[1].trim(), badge: null, note: null, cta: null, pros: [] };
      options.push(current);
      continue;
    }
    if (!current) continue;

    const pro = line.match(/^-\s+(.*)$/);
    if (pro) {
      current.pros.push(pro[1].trim());
      continue;
    }

    const field = line.match(/^(badge|note|cta):\s*(.*)$/);
    if (field) {
      current[field[1]] = field[2].trim();
      continue;
    }
    // Any other line is ignored (degrade quietly, never throw).
  }
  return options;
}

// Parse the body of a `mdp:flow` fenced block into an ordered list of steps.
// Steps are separated by `->`: the whole body is joined and split on `->`, each
// part trimmed, empties dropped. If there is no `->` at all, each non-empty line
// is treated as its own step (so a one-step-per-line body still works).
function parseFlowBody(bodyLines) {
  const joined = bodyLines.join("\n");
  if (joined.includes("->")) {
    return joined
      .split("->")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return bodyLines.map((l) => l.trim()).filter((l) => l.length > 0);
}

// Parse the inner lines of a `:::callout` container into paragraph blocks: one
// paragraph per blank-line-separated group. Inline marks are left to the
// renderer (each paragraph text flows through inline() there). Lists and other
// blocks inside a callout are a future addition; paragraphs are enough now.
function parseCalloutParagraphs(innerLines) {
  const blocks = [];
  let buf = [];
  const flush = () => {
    const text = buf.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    buf = [];
  };
  for (const raw of innerLines) {
    if (raw.trim() === "") {
      flush();
    } else {
      buf.push(raw.trim());
    }
  }
  flush();
  return blocks;
}

// Detect a leading line role tag, e.g. "{.lead} text" or "{.cite} text".
// Returns { role, text } with role null when there is none.
function splitRole(line) {
  const m = line.match(/^\{\.([a-zA-Z][\w-]*)\}\s?(.*)$/);
  if (!m) return { role: null, text: line };
  return { role: m[1], text: m[2] };
}

// Parse a `mdp:chart` body into label/value pairs. Same grammar as stats, but the
// value is coerced to a number; a line whose value is not numeric is dropped, so a
// malformed chart still renders the rows it can read.
function parseChartBody(bodyLines) {
  const items = [];
  for (const bl of bodyLines) {
    const colon = bl.indexOf(":");
    if (colon === -1) continue;
    const label = bl.slice(0, colon).trim();
    const value = parseFloat(bl.slice(colon + 1).trim());
    if (label && Number.isFinite(value)) items.push({ label, value });
  }
  return items;
}

// Split one GFM table row into trimmed cells, tolerating optional outer pipes.
function splitPipeRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

// A GFM delimiter row: every cell is dashes with optional leading/trailing colons.
function isDelimiterRow(line) {
  const s = line.trim();
  if (!s.includes("-")) return false;
  return splitPipeRow(s).every((c) => /^:?-+:?$/.test(c));
}

// Column alignment from a delimiter cell, as a LOGICAL keyword (RTL-safe).
function alignFromDelim(cell) {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "end";
  return "start";
}

// Parse pipe-table lines (header, delimiter, then body rows) into the table IR.
// Returns null when the second line is not a delimiter, so a caller can degrade.
// Rows are padded/truncated to the header width, and align is normalised to it.
function parseTableRows(lines) {
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length < 2 || !isDelimiterRow(nonEmpty[1])) return null;
  const header = splitPipeRow(nonEmpty[0]);
  const width = header.length;
  const align = splitPipeRow(nonEmpty[1]).map(alignFromDelim);
  while (align.length < width) align.push("start");
  const rows = nonEmpty.slice(2).map((l) => {
    const cells = splitPipeRow(l);
    while (cells.length < width) cells.push("");
    return cells.slice(0, width);
  });
  return { align: align.slice(0, width), header, rows };
}

// Parse a `mdp:diagram` body into nodes + edges (shared across every kind).
//   `A -> B` / `A --> B`              an edge (--> is dashed), optional `: label`
//   `id: label` / `actor id: label`   declare or label a node
//   bare token                        a node whose label is the token itself
// Nodes appear in first-seen order; an edge endpoint not declared is auto-created.
function parseDiagramBody(bodyLines) {
  const labels = new Map();
  const order = [];
  const edges = [];
  const ensure = (id) => {
    if (!labels.has(id)) {
      labels.set(id, id);
      order.push(id);
    }
  };
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (line === "") continue;
    const edge = line.match(/^(.+?)\s*(-->|->)\s*([^:]+?)(?:\s*:\s*(.*))?$/);
    if (edge) {
      const from = edge[1].trim();
      const to = edge[3].trim();
      ensure(from);
      ensure(to);
      edges.push({
        from,
        to,
        label: edge[4] != null ? edge[4].trim() : null,
        dashed: edge[2] === "-->",
      });
      continue;
    }
    let decl = line;
    const actor = decl.match(/^actor\s+(.*)$/i);
    if (actor) decl = actor[1].trim();
    const node = decl.match(/^([^:]+):\s*(.*)$/);
    if (node) {
      const id = node[1].trim();
      ensure(id);
      if (node[2].trim()) labels.set(id, node[2].trim());
      continue;
    }
    ensure(line);
  }
  return { nodes: order.map((id) => ({ id, label: labels.get(id) })), edges };
}

// Parse a `mdp:timeline` body into steps: a `# Title` starts a step; the following
// non-empty lines are its body (joined with spaces). Same scanner as compare.
function parseTimelineBody(bodyLines) {
  const steps = [];
  let current = null;
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (line === "") continue;
    const head = line.match(/^#\s+(.*)$/);
    if (head) {
      current = { title: head[1].trim(), body: "" };
      steps.push(current);
      continue;
    }
    if (!current) continue;
    current.body = current.body ? current.body + " " + line : line;
  }
  return steps;
}

// Parse a `mdp:faq` body into Q/A pairs: a `Q:` line starts an item; an `A:` line
// (and any following lines) is its answer.
function parseFaqBody(bodyLines) {
  const items = [];
  let current = null;
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (line === "") continue;
    const q = line.match(/^Q:\s*(.*)$/i);
    if (q) {
      current = { q: q[1].trim(), a: "" };
      items.push(current);
      continue;
    }
    if (!current) continue;
    const a = line.match(/^A:\s*(.*)$/i);
    const text = a ? a[1].trim() : line;
    current.a = current.a ? current.a + " " + text : text;
  }
  return items;
}

// Parse a `mdp:pricing` body into tiers: a `# Name` starts a tier; `badge:`,
// `price:`, `period:`, `cta:` set fields; `- feature` appends to the checklist.
function parsePricingBody(bodyLines) {
  const tiers = [];
  let current = null;
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (line === "") continue;
    const head = line.match(/^#\s+(.*)$/);
    if (head) {
      current = { name: head[1].trim(), badge: null, price: null, period: null, cta: null, features: [] };
      tiers.push(current);
      continue;
    }
    if (!current) continue;
    const feat = line.match(/^-\s+(.*)$/);
    if (feat) {
      current.features.push(feat[1].trim());
      continue;
    }
    const field = line.match(/^(badge|price|period|cta):\s*(.*)$/);
    if (field) current[field[1]] = field[2].trim();
  }
  return tiers;
}

// Parse the body into the flat blocks array.
export function parseBody(body) {
  const lines = body.split("\n");
  const blocks = [];
  let seenTitle = false;

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Blank line: skip.
    if (line === "") {
      i++;
      continue;
    }

    // Thematic break: exactly `---` on its own line.
    if (line === "---") {
      blocks.push({ type: "break" });
      i++;
      continue;
    }

    // Fenced block. Only ```mdp:stats is interpreted; any other fence falls
    // back to a paragraph of its joined body so nothing is lost.
    if (line.startsWith("```")) {
      const fenceInfo = line.slice(3).trim();
      const bodyLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "```") {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence (if present)
      if (fenceInfo === "mdp:stats") {
        const items = [];
        for (const bl of bodyLines) {
          const colon = bl.indexOf(":");
          if (colon === -1) continue;
          const label = bl.slice(0, colon).trim();
          const value = bl.slice(colon + 1).trim();
          if (label) items.push({ label, value });
        }
        blocks.push({ type: "stats", items });
      } else if (fenceInfo === "mdp:compare") {
        blocks.push({ type: "compare", options: parseCompareBody(bodyLines) });
      } else if (fenceInfo === "mdp:flow") {
        blocks.push({ type: "flow", steps: parseFlowBody(bodyLines) });
      } else if (fenceInfo === "mdp:chart") {
        blocks.push({ type: "chart", items: parseChartBody(bodyLines) });
      } else if (fenceInfo === "mdp:table") {
        const table = parseTableRows(bodyLines);
        if (table) {
          blocks.push({ type: "table", ...table });
        } else {
          const text = bodyLines.join(" ").trim();
          if (text) blocks.push({ type: "paragraph", text });
        }
      } else if (fenceInfo === "mdp:diagram" || fenceInfo.startsWith("mdp:diagram ")) {
        const kind = fenceInfo.slice("mdp:diagram".length).trim() || "flow";
        if (DIAGRAM_KINDS.includes(kind)) {
          blocks.push({ type: "diagram", kind, ...parseDiagramBody(bodyLines) });
        } else {
          const text = bodyLines.join(" ").trim();
          if (text) blocks.push({ type: "paragraph", text });
        }
      } else if (fenceInfo === "mdp:timeline") {
        blocks.push({ type: "timeline", steps: parseTimelineBody(bodyLines) });
      } else if (fenceInfo === "mdp:faq") {
        blocks.push({ type: "faq", items: parseFaqBody(bodyLines) });
      } else if (fenceInfo === "mdp:pricing") {
        blocks.push({ type: "pricing", tiers: parsePricingBody(bodyLines) });
      } else {
        const text = bodyLines.join(" ").trim();
        if (text) blocks.push({ type: "paragraph", text });
      }
      continue;
    }

    // Triple-colon container: `:::callout <variant>` ... `:::`. The opening
    // line names a directive (and, for callout, a variant); content runs until a
    // line that is exactly `:::`. Only `callout` is interpreted; any other
    // directive degrades gracefully: its inner content is parsed as normal
    // blocks and spliced in, so nothing is lost and nothing throws.
    if (line.startsWith(":::") && line !== ":::") {
      // Tokens after the colons: `<directive> [variant ...]`. Tolerate the
      // `::: callout` form (a space after the colons) by trimming the remainder.
      const head = line.slice(3).trim().split(/\s+/);
      const directive = (head[0] || "").toLowerCase();
      const variantRaw = (head[1] || "").toLowerCase();

      const innerLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        innerLines.push(lines[i]);
        i++;
      }
      i++; // consume the closing ::: (if present)

      if (directive === "callout") {
        const variant = CALLOUT_VARIANTS.includes(variantRaw) ? variantRaw : "note";
        blocks.push({
          type: "callout",
          variant,
          blocks: parseCalloutParagraphs(innerLines),
        });
      } else {
        // Unknown container: degrade to its inner blocks, parsed normally.
        for (const b of parseBody(innerLines.join("\n"))) blocks.push(b);
      }
      continue;
    }

    // Blockquote: consecutive `>` lines. A `{.cite}` line inside becomes cite.
    if (line.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      let text = [];
      let cite = null;
      for (const ql of quoteLines) {
        const { role, text: rest } = splitRole(ql);
        if (role === "cite") {
          cite = rest.trim();
        } else if (ql.trim() !== "") {
          text.push(ql.trim());
        }
      }
      // Strip surrounding straight quotes the author may have typed.
      let quoteText = text.join(" ").trim();
      quoteText = quoteText.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      blocks.push({ type: "quote", text: quoteText, cite });
      continue;
    }

    // Heading. `# ` is the title (first H1); `## ` is a section heading.
    if (line.startsWith("#")) {
      const m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) {
        const level = m[1].length;
        const text = m[2].trim();
        if (level === 1 && !seenTitle) {
          blocks.push({ type: "title", text });
          seenTitle = true;
        } else {
          blocks.push({ type: "heading", level: Math.min(level, 2), text });
        }
        i++;
        continue;
      }
    }

    // Unordered list: consecutive `- ` lines.
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list: consecutive `1.` style lines.
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // GFM pipe table: a row containing `|` immediately followed by a delimiter
    // row (`| --- | :--: |`). Consume the contiguous pipe rows; an unexpected
    // non-table run degrades to a paragraph so nothing is lost.
    if (line.includes("|") && i + 1 < lines.length && isDelimiterRow(lines[i + 1])) {
      const tableLines = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseTableRows(tableLines);
      if (table) {
        blocks.push({ type: "table", ...table });
      } else {
        const text = tableLines.join(" ").trim();
        if (text) blocks.push({ type: "paragraph", text });
      }
      continue;
    }

    // Line role on a standalone line (e.g. `{.lead} ...`).
    const { role, text } = splitRole(line);
    if (role === "lead") {
      blocks.push({ type: "lead", text: text.trim() });
      i++;
      continue;
    }

    // Otherwise gather a paragraph: consecutive plain lines until a blank line
    // or a line that starts a different block.
    const paraLines = [text];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        next === "" ||
        next === "---" ||
        next.startsWith("#") ||
        next.startsWith(">") ||
        next.startsWith("```") ||
        next.startsWith(":::") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        /^\{\.[a-zA-Z]/.test(next)
      ) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ").trim() });
  }

  return blocks;
}

// Parse a full MDP source string into the IR { meta, blocks }.
export function parse(source) {
  const normalized = String(source).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const { meta, rest } = parseFrontmatter(normalized);
  const blocks = parseBody(rest);
  return { meta, blocks };
}
