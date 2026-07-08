// render-letter.mjs: the `letter` artifact: formal correspondence.
//
// A single reading column laid out as a business letter: a letterhead (logo +
// sender), the date, the recipient, a salutation, the body, then a sign-off and
// signature. The framing fields come from optional frontmatter (`from`, `to`,
// `date`, `salutation`, `signoff`); each is left out when absent, so a sparse
// source still reads as a clean letter.
//
//   title            -> an optional subject line above the salutation
//   {.lead}          -> the opening line of the body
//   ## sections      -> body paragraphs in flow
//
// Print-tuned: light mode, @page margins.

import { inline, escapeHtml } from "./inline.mjs";
import {
  htmlDocument,
  deriveTitle,
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
import { renderTasks, TASKS_STYLE } from "./tasks.mjs";

const LETTER_STYLE = `.mdp-letter {
  max-width: 44rem;
  margin: 0 auto;
  padding: var(--mdp-space-8) var(--mdp-space-5);
}

.mdp-letter-head { margin-bottom: var(--mdp-space-7); }
.mdp-letter-head .mdp-logo { height: 2rem; max-width: 12rem; }
.mdp-letter-from { font-weight: var(--mdp-weight-medium); color: var(--mdp-ink); }

.mdp-letter-date { color: var(--mdp-ink-soft); margin: 0 0 var(--mdp-space-6); }
.mdp-letter-to { color: var(--mdp-ink); margin: 0 0 var(--mdp-space-6); }
.mdp-letter-subject { font-weight: var(--mdp-weight-medium); color: var(--mdp-ink); margin: 0 0 var(--mdp-space-5); }
.mdp-letter-salutation { color: var(--mdp-ink); margin: 0 0 var(--mdp-space-5); }

.mdp-letter-body > * + * { margin-top: var(--mdp-space-4); }
.mdp-letter-body .mdp-lead { font-size: var(--mdp-text-lead); }
.mdp-letter-section > * + * { margin-top: var(--mdp-space-4); }
.mdp-letter-section .mdp-h2 { margin-bottom: var(--mdp-space-3); }
.mdp-letter .mdp-quote-text { font-size: var(--mdp-text-lead); }

/* Sign-off: room for a signature between the closing line and the name. */
.mdp-letter-signoff { margin-top: var(--mdp-space-7); }
.mdp-letter-signoff-line { color: var(--mdp-ink-soft); margin: 0 0 var(--mdp-space-6); }
.mdp-letter-signer { font-weight: var(--mdp-weight-medium); color: var(--mdp-ink); margin: 0; }

${COMPARE_STYLE}

${FLOW_STYLE}

${CALLOUT_STYLE}

${TABLE_STYLE}

${CHART_STYLE}

${DIAGRAM_STYLE}

${TIMELINE_STYLE}

${FAQ_STYLE}

${PRICING_STYLE}

${TASKS_STYLE}

/* Print to PDF (Cmd or Ctrl + P): light, full-page column. */
@media print {
  :root {
    --mdp-bg: #ffffff; --mdp-surface: #f6f6f3; --mdp-ink: #18181b;
    --mdp-ink-soft: #52525b; --mdp-ink-faint: #8a8a8f; --mdp-border: rgba(0, 0, 0, 0.10);
  }
  .mdp-letter { max-width: none; padding: 0; }
  .mdp-figure-img { break-inside: avoid; }
  @page { margin: 2.5cm; }
}`;

// A trimmed frontmatter string, or "" when absent.
function metaStr(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

// Render one body block in flow. Shares the `page` reading of every block.
function renderLetterBlock(block) {
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
    case "image":
      return `<figure class="mdp-figure-img"><img src="${block.src}" alt="${escapeHtml(
        block.alt
      )}" loading="lazy"></figure>`;
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
    case "tasks":
      return renderTasks(block);
    default:
      return "";
  }
}

export function renderLetter(ir) {
  const meta = (ir && ir.meta) || {};
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);

  const from = metaStr(meta.from);
  const to = metaStr(meta.to);
  const date = metaStr(meta.date);
  const salutation = metaStr(meta.salutation);
  const signoff = metaStr(meta.signoff);

  // A subject line only when the source carries a real title (not the generic
  // fallback), so a pure letter without a heading stays clean.
  const hasTitle =
    (typeof meta.title === "string" && meta.title.trim()) ||
    ir.blocks.some((b) => b.type === "title");
  const subject = hasTitle ? title || docTitle : "";

  const letterhead =
    `<header class="mdp-letter-head">\n` +
    renderLogo(deriveLogo(ir), subject || from || docTitle) +
    (from ? `<div class="mdp-letter-from">${inline(from)}</div>\n` : "") +
    `</header>`;

  const meta_lines =
    (date ? `<p class="mdp-letter-date">${inline(date)}</p>\n` : "") +
    (to ? `<div class="mdp-letter-to">${inline(to)}</div>\n` : "") +
    (subject ? `<p class="mdp-letter-subject">${inline(subject)}</p>\n` : "") +
    (salutation ? `<p class="mdp-letter-salutation">${inline(salutation)}</p>\n` : "");

  const bodyParts = [];
  if (lead) bodyParts.push(`<p class="mdp-lead">${inline(lead)}</p>`);
  for (const section of rest) {
    const inner = section.blocks.map(renderLetterBlock).filter(Boolean).join("\n");
    if (inner.trim()) {
      bodyParts.push(`<section class="mdp-letter-section">\n${inner}\n</section>`);
    }
  }

  const signoffBlock =
    signoff || from
      ? `<div class="mdp-letter-signoff">\n` +
        (signoff ? `<p class="mdp-letter-signoff-line">${inline(signoff)}</p>\n` : "") +
        (from ? `<p class="mdp-letter-signer">${inline(from)}</p>\n` : "") +
        `</div>`
      : "";

  const body =
    `<article class="mdp-letter">\n` +
    `${letterhead}\n` +
    meta_lines +
    `<div class="mdp-letter-body">\n${bodyParts.join("\n")}\n</div>\n` +
    (signoffBlock ? `${signoffBlock}\n` : "") +
    `</article>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: LETTER_STYLE,
    body,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
