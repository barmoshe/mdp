// render-memo.mjs: the `memo` artifact: an internal business memo.
//
// A tight single column with the classic memo masthead: a MEMORANDUM eyebrow, a
// labelled To / From / Date / Re block, a hairline, then the body. The header
// fields come from optional frontmatter (`to`, `from`, `date`); the subject line
// (`Re`) is the document title. Any field the author omits is left out, so the
// masthead never shows an empty row.
//
//   title            -> the Re: subject line
//   {.lead}          -> the memo's opening standfirst
//   ## sections      -> body sections in flow
//
// Print-tuned: light mode, @page margins.

import { inline } from "./inline.mjs";
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

const MEMO_STYLE = `.mdp-memo {
  max-width: 44rem;
  margin: 0 auto;
  padding: var(--mdp-space-8) var(--mdp-space-5);
}

.mdp-memo-header .mdp-eyebrow { margin-bottom: var(--mdp-space-5); }
.mdp-memo-header .mdp-logo { height: 2rem; max-width: 12rem; }

/* The labelled To / From / Date / Re block. */
.mdp-memo-meta { display: grid; gap: var(--mdp-space-2); }
.mdp-memo-row { display: flex; gap: var(--mdp-space-4); align-items: baseline; }
.mdp-memo-label {
  flex: none;
  min-width: 4.5rem;
  font-size: var(--mdp-text-eyebrow);
  font-weight: var(--mdp-weight-medium);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mdp-ink-faint);
}
.mdp-memo-value { color: var(--mdp-ink); font-weight: var(--mdp-weight-medium); }

.mdp-memo-rule { margin: var(--mdp-space-6) 0; }

.mdp-memo-lead {
  font-size: var(--mdp-text-lead);
  margin-bottom: var(--mdp-space-6);
}

.mdp-memo-section + .mdp-memo-section { margin-top: var(--mdp-space-6); }
.mdp-memo-section .mdp-h2 { margin-bottom: var(--mdp-space-4); }
.mdp-memo-section > * + * { margin-top: var(--mdp-space-4); }
.mdp-memo .mdp-quote-text { font-size: var(--mdp-text-lead); }
.mdp-memo .mdp-hr { margin: var(--mdp-space-5) 0; }

${COMPARE_STYLE}

${FLOW_STYLE}

${CALLOUT_STYLE}

${TABLE_STYLE}

${CHART_STYLE}

${DIAGRAM_STYLE}

/* Print to PDF (Cmd or Ctrl + P): light, full-page column. */
@media print {
  :root {
    --mdp-bg: #ffffff; --mdp-surface: #f6f6f3; --mdp-ink: #18181b;
    --mdp-ink-soft: #52525b; --mdp-ink-faint: #8a8a8f; --mdp-border: rgba(0, 0, 0, 0.10);
  }
  .mdp-memo { max-width: none; padding: 0; }
  @page { margin: 2cm; }
}`;

// A trimmed frontmatter string, or "" when absent. The frontmatter scanner keeps
// the value verbatim (it does not strip quotes), so authors write bare text.
function metaStr(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

// Render one body block in flow. Shares the `page` reading of every block.
function renderMemoBlock(block) {
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

export function renderMemo(ir) {
  const meta = (ir && ir.meta) || {};
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);
  const subject = title || docTitle;

  // The eyebrow names the document category; for a memo it is MEMORANDUM unless
  // the author overrides it with `kicker`.
  const eyebrow = metaStr(meta.kicker) || "Memorandum";

  // The masthead rows. Re (the subject) always shows; To/From/Date show only
  // when supplied. Order is the conventional To, From, Date, Re.
  const rows = [
    ["To", metaStr(meta.to)],
    ["From", metaStr(meta.from)],
    ["Date", metaStr(meta.date)],
    ["Re", subject],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<div class="mdp-memo-row"><span class="mdp-memo-label">${label}</span>` +
        `<span class="mdp-memo-value">${inline(value)}</span></div>`
    )
    .join("\n");

  const header =
    `<header class="mdp-memo-header">\n` +
    renderLogo(deriveLogo(ir), subject) +
    `<p class="mdp-eyebrow">${inline(eyebrow)}</p>\n` +
    `<div class="mdp-memo-meta">\n${rows}\n</div>\n` +
    `</header>`;

  const bodyParts = [];
  if (lead) bodyParts.push(`<p class="mdp-lead mdp-memo-lead">${inline(lead)}</p>`);
  for (const section of rest) {
    const inner = section.blocks.map(renderMemoBlock).filter(Boolean).join("\n");
    if (inner.trim()) {
      bodyParts.push(`<section class="mdp-memo-section">\n${inner}\n</section>`);
    }
  }

  const body =
    `<article class="mdp-memo">\n` +
    `${header}\n` +
    `<hr class="mdp-hr mdp-memo-rule">\n` +
    `<div class="mdp-memo-body">\n${bodyParts.join("\n")}\n</div>\n` +
    `</article>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: MEMO_STYLE,
    body,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
