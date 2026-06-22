// render-onepager.mjs: the `onepager` artifact: a single dense sheet.
//
// An executive leave-behind: one Letter/A4-shaped sheet with a header band and
// a tight two-column grid of sections, the whole thing taken in at a glance and
// handed over. Denser than the flyer (a small on-screen card) and built to print
// to one page. Composition, following the SPEC table:
//   title + {.lead}  -> header band (eyebrow + title + lead)
//   ## text sections -> cells in a two-column grid (they pack densely)
//   compare/flow/    -> full-width cells that span both columns
//     callout/quote
//   mdp:stats        -> a full-width figure band
//   final text       -> a footer strip (contact / call to action)
//
// Built for short content; long content simply flows to a second printed page
// (the engine never shrinks type to fit — the design is locked).

import { inline } from "./inline.mjs";
import {
  htmlDocument,
  deriveTitle,
  deriveEyebrow,
  deriveLangDir,
  deriveTheme,
  deriveBrandAccent,
  deriveBrandAccent2,
  deriveBrandFont,
  splitSections,
  extractMasthead,
  deriveLogo,
  renderLogo,
} from "./shared.mjs";
import { renderCompare, COMPARE_STYLE } from "./compare.mjs";
import { renderFlow, FLOW_STYLE } from "./flow.mjs";
import { renderCallout, CALLOUT_STYLE } from "./callout.mjs";
import { renderTable, TABLE_STYLE } from "./table.mjs";
import { renderChart, CHART_STYLE } from "./chart.mjs";
import { renderDiagram, DIAGRAM_STYLE } from "./diagram.mjs";
import { renderTimeline, TIMELINE_STYLE } from "./timeline.mjs";
import { renderFaq, FAQ_STYLE } from "./faq.mjs";
import { renderPricing, PRICING_STYLE } from "./pricing.mjs";

const ONEPAGER_STYLE = `.mdp-onepager-stage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--mdp-space-7) var(--mdp-space-5);
}

.mdp-onepager {
  width: 100%;
  max-width: 51rem;
  border: 1px solid var(--mdp-border);
  border-radius: 12px;
  background: var(--mdp-bg);
  padding: var(--mdp-space-7);
}

.mdp-onepager-header { margin-bottom: var(--mdp-space-6); }
.mdp-onepager-header .mdp-eyebrow { margin-bottom: var(--mdp-space-3); }
.mdp-onepager-header .mdp-title {
  font-size: 2rem;
  margin-bottom: var(--mdp-space-4);
}
.mdp-onepager-header .mdp-lead { font-size: var(--mdp-text-lead); }
.mdp-onepager-header .mdp-logo { height: 2.25rem; max-width: 13rem; }

/* The packing grid: text cells take one column, wide blocks span both. */
.mdp-onepager-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mdp-space-5) var(--mdp-space-6);
  align-content: start;
}
@media (max-width: 40rem) { .mdp-onepager-grid { grid-template-columns: 1fr; } }
.mdp-onepager-item { min-width: 0; }
.mdp-onepager-item.is-wide { grid-column: 1 / -1; }
.mdp-onepager-item > * + * { margin-top: var(--mdp-space-3); }
.mdp-onepager-item .mdp-h2 { font-size: var(--mdp-text-body); margin-bottom: var(--mdp-space-3); }
.mdp-onepager-item .mdp-p { font-size: var(--mdp-text-small); }
.mdp-onepager-item .mdp-list { font-size: var(--mdp-text-small); padding-inline-start: 1.1em; }
.mdp-onepager-item .mdp-list li + li { margin-top: var(--mdp-space-1); }

/* Stats band: a tinted strip spanning the sheet. */
.mdp-onepager-band {
  padding: var(--mdp-space-5) var(--mdp-space-6);
  background: var(--mdp-surface);
  border-radius: 10px;
}
.mdp-onepager-band .mdp-figures { gap: var(--mdp-space-6); justify-content: space-between; }
.mdp-onepager-band .mdp-figure-value { font-size: 1.5rem; color: var(--mdp-accent-text); }

.mdp-onepager-quote .mdp-quote-text { font-size: 1.25rem; }

/* Footer strip: the trailing section, set off by a hairline. */
.mdp-onepager-footer {
  margin-top: var(--mdp-space-6);
  padding-top: var(--mdp-space-5);
  border-top: 1px solid var(--mdp-border);
}
.mdp-onepager-footer .mdp-h2 { font-size: var(--mdp-text-body); margin-bottom: var(--mdp-space-3); }
.mdp-onepager-footer .mdp-p { font-size: var(--mdp-text-small); }
.mdp-onepager-footer .mdp-list { font-size: var(--mdp-text-small); }

${COMPARE_STYLE}

/* On the dense sheet the compare cards sit tighter. */
.mdp-onepager .mdp-compare { gap: var(--mdp-space-4); }
.mdp-onepager .mdp-compare-card { padding: var(--mdp-space-4); }
.mdp-onepager .mdp-compare-name { font-size: var(--mdp-text-body); }

${FLOW_STYLE}

${CALLOUT_STYLE}

/* On the dense sheet the callout sits tighter. */
.mdp-onepager .mdp-callout { padding: var(--mdp-space-4); }
.mdp-onepager .mdp-callout-p { font-size: var(--mdp-text-small); }

${TABLE_STYLE}

${CHART_STYLE}

${DIAGRAM_STYLE}

${TIMELINE_STYLE}

${FAQ_STYLE}

${PRICING_STYLE}

/* Print to PDF (Cmd or Ctrl + P): one sheet, light, no frame. */
@media print {
  :root {
    --mdp-bg: #ffffff; --mdp-surface: #f6f6f3; --mdp-ink: #18181b;
    --mdp-ink-soft: #52525b; --mdp-ink-faint: #8a8a8f; --mdp-border: rgba(0, 0, 0, 0.10);
  }
  .mdp-onepager-stage { display: block; min-height: auto; padding: 0; }
  .mdp-onepager { max-width: none; border: 0; border-radius: 0; padding: 0; }
  .mdp-onepager-item, .mdp-onepager-band { break-inside: avoid; }
  @page { margin: 1.5cm; }
}`;

// Render a stats block as a figure band that spans the sheet.
function renderStatsBand(statsBlock) {
  const figs = statsBlock.items
    .map(
      (s) =>
        `<div class="mdp-figure"><span class="mdp-figure-value">${inline(
          s.value
        )}</span><span class="mdp-figure-label">${inline(s.label)}</span></div>`
    )
    .join("\n");
  return `<div class="mdp-onepager-band">\n<div class="mdp-figures">\n${figs}\n</div>\n</div>`;
}

// Render a quote block as a serif pull quote.
function renderQuoteBlock(quoteBlock) {
  const cite = quoteBlock.cite
    ? `\n<figcaption class="mdp-quote-cite">${inline(quoteBlock.cite)}</figcaption>`
    : "";
  return (
    `<figure class="mdp-quote mdp-onepager-quote">\n` +
    `<blockquote class="mdp-quote-text">${inline(quoteBlock.text)}</blockquote>${cite}\n` +
    `</figure>`
  );
}

// Render one block in flow. Handles every body block type so a stats band, a
// callout, or a mid-document lead beside other content is never dropped.
function renderOnepagerBlock(block) {
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
    case "stats":
      return renderStatsBand(block);
    case "quote":
      return renderQuoteBlock(block);
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

function renderSectionInner(section) {
  return section.blocks.map(renderOnepagerBlock).filter(Boolean).join("\n");
}

// Classify a section so the grid knows whether it spans one column or both.
// Compare/callout/flow/stats/quote are full-width by nature; plain text packs
// into a single column.
function classify(section) {
  const types = section.blocks.map((b) => b.type);
  if (types.includes("compare")) return "wide";
  if (types.includes("callout")) return "wide";
  if (types.includes("flow")) return "wide";
  if (types.includes("stats")) return "wide";
  if (types.includes("quote")) return "wide";
  if (
    types.includes("table") || types.includes("chart") || types.includes("diagram") ||
    types.includes("timeline") || types.includes("faq") || types.includes("pricing")
  ) return "wide";
  return "text";
}

export function renderOnepager(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);

  const headerTitle = title || docTitle;
  const header =
    `<header class="mdp-onepager-header">\n` +
    renderLogo(deriveLogo(ir), headerTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(headerTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  const kinds = rest.map(classify);

  // The trailing text section becomes the footer strip.
  let footerIndex = -1;
  for (let i = rest.length - 1; i >= 0; i--) {
    if (kinds[i] === "text") {
      footerIndex = i;
      break;
    }
  }

  const items = [];
  rest.forEach((section, i) => {
    if (i === footerIndex) return; // handled as the footer, below
    const wide = kinds[i] === "wide";
    items.push(
      `<div class="mdp-onepager-item${wide ? " is-wide" : ""}">\n` +
        `${renderSectionInner(section)}\n` +
        `</div>`
    );
  });

  const grid = items.length
    ? `<div class="mdp-onepager-grid">\n${items.join("\n")}\n</div>`
    : "";

  const footer =
    footerIndex >= 0
      ? `<footer class="mdp-onepager-footer">\n${renderSectionInner(
          rest[footerIndex]
        )}\n</footer>`
      : "";

  const body =
    `<div class="mdp-onepager-stage">\n` +
    `<article class="mdp-onepager">\n` +
    `${header}\n` +
    (grid ? `${grid}\n` : "") +
    (footer ? `${footer}\n` : "") +
    `</article>\n` +
    `</div>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: ONEPAGER_STYLE,
    body,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
