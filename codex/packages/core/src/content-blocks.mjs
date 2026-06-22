// content-blocks.mjs: the shared content-flow block renderer used by the
// interactive reading forms (scroll, accordion, tabs, stepper).
//
// page/slides/flyer each own a per-form block switch because they render some
// blocks differently (stats as a table vs. a figure band, quote sizing, ...).
// The four interactive reading forms instead render every block identically, in
// one calm document flow (stats as a table, quote as a serif pull quote, the
// rest via their block modules), so the switch is factored here once: a new
// block type is then wired into all four forms in a single place. Pure: it
// solves the IR only, with no clocks and no randomness.

import { inline } from "./inline.mjs";
import { renderCompare, COMPARE_STYLE } from "./compare.mjs";
import { renderFlow, FLOW_STYLE } from "./flow.mjs";
import { renderCallout, CALLOUT_STYLE } from "./callout.mjs";
import { renderTable, TABLE_STYLE } from "./table.mjs";
import { renderChart, CHART_STYLE } from "./chart.mjs";
import { renderDiagram, DIAGRAM_STYLE } from "./diagram.mjs";
import { renderTimeline, TIMELINE_STYLE } from "./timeline.mjs";
import { renderFaq, FAQ_STYLE } from "./faq.mjs";
import { renderPricing, PRICING_STYLE } from "./pricing.mjs";

// The CSS for every block module these forms can render. The base block classes
// (.mdp-h2, .mdp-list, .mdp-quote, .mdp-stats-table, ...) already live in
// baseStyle; only the richer modules carry their own CSS, gathered here so each
// form appends one string.
export const CONTENT_BLOCK_STYLE = [
  COMPARE_STYLE,
  FLOW_STYLE,
  CALLOUT_STYLE,
  TABLE_STYLE,
  CHART_STYLE,
  DIAGRAM_STYLE,
  TIMELINE_STYLE,
  FAQ_STYLE,
  PRICING_STYLE,
].join("\n\n");

// Render one content block in document flow. title/lead are composed by each
// form's masthead, so they are not handled here. Mirrors the page reading of
// each block. An unknown type degrades to "" (never throws, never blanks).
export function renderContentBlock(block) {
  switch (block.type) {
    case "heading":
      return `<h2 class="mdp-h2">${inline(block.text)}</h2>`;

    case "lead":
      return `<p class="mdp-lead">${inline(block.text)}</p>`;

    case "paragraph":
      return `<p class="mdp-p">${inline(block.text)}</p>`;

    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((it) => `<li>${inline(it)}</li>`).join("\n");
      return `<${tag} class="mdp-list">\n${items}\n</${tag}>`;
    }

    case "stats": {
      const rows = block.items
        .map(
          (s) =>
            `<tr><th class="mdp-stat-label" scope="row">${inline(
              s.label
            )}</th><td class="mdp-stat-value">${inline(s.value)}</td></tr>`
        )
        .join("\n");
      return `<table class="mdp-stats-table">\n<tbody>\n${rows}\n</tbody>\n</table>`;
    }

    case "quote": {
      const cite = block.cite
        ? `\n<figcaption class="mdp-quote-cite">${inline(block.cite)}</figcaption>`
        : "";
      return `<figure class="mdp-quote">\n<blockquote class="mdp-quote-text">${inline(
        block.text
      )}</blockquote>${cite}\n</figure>`;
    }

    case "compare":
      return renderCompare(block);

    case "flow":
      return renderFlow(block);

    case "callout":
      return renderCallout(block);

    case "table":
      return renderTable(block);

    case "chart":
      return renderChart(block);

    case "diagram":
      return renderDiagram(block);

    case "timeline":
      return renderTimeline(block);

    case "faq":
      return renderFaq(block);

    case "pricing":
      return renderPricing(block);

    default:
      return "";
  }
}

// Render a list of blocks in flow, dropping anything that renders to "".
export function renderContentBlocks(blocks) {
  return blocks.map(renderContentBlock).filter(Boolean).join("\n");
}

// A URL-safe slug from heading text, for deep-link hashes. Deterministic and
// content-derived; the caller dedupes across sections.
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// Split a section into its panel label and body blocks. When the section opens
// with a heading, that heading is the label (a tab / accordion / step title)
// and the remaining blocks are the body; otherwise there is no intrinsic label
// and the whole section is the body, named by `fallback`.
export function sectionParts(section, fallback) {
  const blocks = section.blocks;
  if (blocks.length && blocks[0].type === "heading") {
    return { label: blocks[0].text, body: blocks.slice(1) };
  }
  return { label: fallback, body: blocks.slice() };
}
