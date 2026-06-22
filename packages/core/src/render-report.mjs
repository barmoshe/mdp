// render-report.mjs: the `report` artifact: a paginated long-form document.
//
// The serious, structured sibling of `page`: a cover, an auto table of contents
// built from the `##` section headings, and numbered sections that paginate
// cleanly when printed to PDF. It shares `page`'s block reading; the report adds
// the cover, the contents list, and section numbering on top.
//
//   title + {.lead}  -> cover (eyebrow + big title + lead), its own printed page
//   ## sections      -> numbered sections (01, 02, ...), each linked from the TOC
//   ---              -> the section split (one numbered section per group)
//
// Print: light mode forced, @page margins, the cover/TOC/each section start on a
// fresh page. With JS off it is still a complete, readable scrolling document.

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

const REPORT_STYLE = `.mdp-report {
  max-width: 44rem;
  margin: 0 auto;
  padding: var(--mdp-space-8) var(--mdp-space-5);
}

/* Cover: a generous masthead that takes the first printed page. */
.mdp-report-cover {
  padding-block: var(--mdp-space-7) var(--mdp-space-7);
  border-bottom: 1px solid var(--mdp-border);
  margin-bottom: var(--mdp-space-7);
}
.mdp-report-cover .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-report-cover .mdp-title {
  font-size: var(--mdp-text-title);
  margin-bottom: var(--mdp-space-5);
}
.mdp-report-cover .mdp-lead { font-size: var(--mdp-text-lead); }

/* Table of contents: a numbered, linked list of the sections. */
.mdp-report-toc { margin-bottom: var(--mdp-space-8); }
.mdp-report-toc .mdp-eyebrow { margin-bottom: var(--mdp-space-5); }
.mdp-report-toc-list { list-style: none; margin: 0; padding: 0; }
.mdp-report-toc-list li + li {
  margin-top: var(--mdp-space-3);
  padding-top: var(--mdp-space-3);
  border-top: 1px solid var(--mdp-border);
}
.mdp-report-toc-link {
  display: flex;
  align-items: baseline;
  gap: var(--mdp-space-4);
  text-decoration: none;
  color: var(--mdp-ink);
}
.mdp-report-toc-link:hover .mdp-report-toc-text { text-decoration: underline; }
.mdp-report-toc-num {
  flex: none;
  min-width: 2.5ch;
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-accent-text);
  font-variant-numeric: tabular-nums;
}

/* Numbered sections. */
.mdp-report-section { margin-top: var(--mdp-space-8); }
.mdp-report-section:first-of-type { margin-top: 0; }
.mdp-report-num {
  font-size: var(--mdp-text-eyebrow);
  font-weight: var(--mdp-weight-medium);
  letter-spacing: 0.12em;
  color: var(--mdp-accent-text);
  font-variant-numeric: tabular-nums;
  margin: 0 0 var(--mdp-space-2);
}
.mdp-report-heading { margin: 0 0 var(--mdp-space-5); }
.mdp-report-body > * + * { margin-top: var(--mdp-space-4); }
.mdp-report .mdp-figure-value { font-size: var(--mdp-text-h2); color: var(--mdp-accent-text); }
.mdp-report .mdp-quote-text { font-size: var(--mdp-text-lead); }
.mdp-report .mdp-hr { margin: var(--mdp-space-6) 0; }

${COMPARE_STYLE}

${FLOW_STYLE}

${CALLOUT_STYLE}

${TABLE_STYLE}

${CHART_STYLE}

${DIAGRAM_STYLE}

${TIMELINE_STYLE}

${FAQ_STYLE}

${PRICING_STYLE}

/* Print to PDF (Cmd or Ctrl + P): light, cover/TOC/sections each on a new page. */
@media print {
  :root {
    --mdp-bg: #ffffff; --mdp-surface: #f6f6f3; --mdp-ink: #18181b;
    --mdp-ink-soft: #52525b; --mdp-ink-faint: #8a8a8f; --mdp-border: rgba(0, 0, 0, 0.10);
  }
  .mdp-report { max-width: none; padding: 0; }
  .mdp-report-cover { border-bottom: 0; }
  .mdp-report-toc { break-before: page; }
  .mdp-report-section { break-before: page; }
  .mdp-report-num, .mdp-report-heading { break-after: avoid; }
  @page { margin: 2cm; }
}`;

// Render one content block (everything except title/lead, which compose the
// cover). Identical reading to the `page` form so a report and a page share a
// look; the report only changes the surrounding structure.
function renderReportBlock(block) {
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

    default:
      return "";
  }
}

// Zero-pad a 1-based index to a two-digit label (01, 02, ... 10).
function num(n) {
  return String(n).padStart(2, "0");
}

export function renderReport(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);

  const coverTitle = title || docTitle;
  const cover =
    `<header class="mdp-report-cover">\n` +
    renderLogo(deriveLogo(ir), coverTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(coverTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  // Each section becomes a numbered chapter. A leading `## heading` is the
  // chapter title; everything else is its body. A section with no heading still
  // renders (under a generic "Section N" so the contents list stays complete).
  const chapters = rest.map((section, idx) => {
    const first = section.blocks[0];
    const hasHeading = first && first.type === "heading";
    return {
      n: idx + 1,
      id: `report-sec-${idx + 1}`,
      heading: hasHeading ? first.text : `Section ${idx + 1}`,
      bodyBlocks: hasHeading ? section.blocks.slice(1) : section.blocks,
    };
  });

  // Contents list — only worth showing when there is more than one section.
  let toc = "";
  if (chapters.length >= 2) {
    const items = chapters
      .map(
        (c) =>
          `<li><a class="mdp-report-toc-link" href="#${c.id}">` +
          `<span class="mdp-report-toc-num">${num(c.n)}</span>` +
          `<span class="mdp-report-toc-text">${inline(c.heading)}</span>` +
          `</a></li>`
      )
      .join("\n");
    toc =
      `<nav class="mdp-report-toc" aria-label="Contents">\n` +
      `<p class="mdp-eyebrow">Contents</p>\n` +
      `<ol class="mdp-report-toc-list">\n${items}\n</ol>\n` +
      `</nav>`;
  }

  const sectionsHtml = chapters
    .map((c) => {
      const inner = c.bodyBlocks.map(renderReportBlock).filter(Boolean).join("\n");
      return (
        `<section class="mdp-report-section" id="${c.id}">\n` +
        `<p class="mdp-report-num">${num(c.n)}</p>\n` +
        `<h2 class="mdp-h2 mdp-report-heading">${inline(c.heading)}</h2>\n` +
        (inner ? `<div class="mdp-report-body">\n${inner}\n</div>\n` : "") +
        `</section>`
      );
    })
    .join("\n");

  const body =
    `<article class="mdp-report">\n` +
    `${cover}\n` +
    (toc ? `${toc}\n` : "") +
    `${sectionsHtml}\n` +
    `</article>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: REPORT_STYLE,
    body,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
