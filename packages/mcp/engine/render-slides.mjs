// render-slides.mjs: the `slides` artifact: a full-screen click-through deck.
//
// Maps each block per the SPEC table:
//   title + {.lead}  -> title slide (first slide)
//   ## heading       -> slide heading
//   ---              -> slide break
//   list             -> compact list (one item per line; reveals deferred)
//   mdp:stats        -> a row of big figures
//   blockquote+cite  -> a full quote slide
//
// Body is split by `---` into slides. Each slide is a full-viewport stage with
// large display type. Self-contained JS activates a stepper: one slide at a
// time, prev/next buttons, click-to-advance, Arrow keys, an "n / total"
// counter, and dots. With JS off, slides simply stack and remain readable.

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

const SLIDES_STYLE = `.mdp-deck {
  /* No-JS fallback: slides stack and scroll, fully readable. */
}

.mdp-slide {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2rem, 8vh, 6rem) clamp(1.5rem, 8vw, 8rem);
  border-bottom: 1px solid var(--mdp-border);
}

.mdp-slide-inner {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}
.mdp-slide-inner > * + * { margin-top: var(--mdp-space-5); }

.mdp-slide .mdp-eyebrow { margin-bottom: var(--mdp-space-5); }
.mdp-slide .mdp-title {
  font-size: clamp(2.5rem, 7vw, 4rem);
  letter-spacing: -0.025em;
}
.mdp-slide .mdp-lead { font-size: clamp(1.25rem, 3.2vw, 1.875rem); }
.mdp-slide .mdp-logo { height: clamp(2.5rem, 5vh, 3.5rem); max-width: 16rem; margin-block-end: var(--mdp-space-6); }
.mdp-slide .mdp-h2 { font-size: clamp(1.75rem, 4.4vw, 2.75rem); }
.mdp-slide .mdp-p { font-size: clamp(1.0625rem, 2vw, 1.375rem); }

.mdp-slide .mdp-list { font-size: clamp(1.125rem, 2.4vw, 1.5rem); }
.mdp-slide .mdp-list li + li { margin-top: var(--mdp-space-3); }

.mdp-slide .mdp-figures { gap: clamp(1.5rem, 5vw, 4rem); }
.mdp-slide .mdp-figure-value { font-size: clamp(2.5rem, 7vw, 4rem); }
.mdp-slide .mdp-figure-label { font-size: clamp(0.9rem, 1.6vw, 1.0625rem); }

.mdp-slide .mdp-quote { border-inline-start-width: 3px; padding-inline-start: var(--mdp-space-6); }
.mdp-slide .mdp-quote-text { font-size: clamp(1.75rem, 4.4vw, 2.75rem); }
.mdp-slide .mdp-quote-cite { font-size: clamp(0.95rem, 1.8vw, 1.125rem); margin-top: var(--mdp-space-4); }

/* JS-on stepper UI. The .mdp-js class is added by the script. */
.mdp-js .mdp-slide {
  position: fixed;
  inset: 0;
  min-height: 100vh;
  border-bottom: 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity 240ms ease;
}
.mdp-js .mdp-slide.is-active { opacity: 1; visibility: visible; }

.mdp-chrome {
  position: fixed;
  inset-inline: 0; bottom: 0;
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: var(--mdp-space-4);
  padding: var(--mdp-space-4) var(--mdp-space-5);
  z-index: 10;
}
.mdp-js .mdp-chrome { display: flex; }

.mdp-dots { display: flex; gap: var(--mdp-space-2); }
.mdp-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--mdp-ink-faint);
  opacity: 0.4;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: opacity 120ms ease, background 120ms ease;
}
.mdp-dot.is-active { opacity: 1; background: var(--mdp-accent2, var(--mdp-accent)); }

.mdp-nav { display: flex; align-items: center; gap: var(--mdp-space-3); }
.mdp-counter {
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-faint);
  font-variant-numeric: tabular-nums;
  min-width: 4.5ch;
  text-align: center;
}
.mdp-btn {
  font-family: inherit;
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 6px;
  padding: var(--mdp-space-2) var(--mdp-space-4);
  cursor: pointer;
  line-height: 1;
}
.mdp-btn:disabled { opacity: 0.35; cursor: default; }
.mdp-btn:focus-visible,
.mdp-dot:focus-visible {
  outline: 2px solid var(--mdp-accent-border);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .mdp-js .mdp-slide { transition: none; }
  .mdp-dot { transition: none; }
}

${COMPARE_STYLE}

/* On a slide, the compare grid uses the full stage width and a larger gap. */
.mdp-slide .mdp-compare { gap: var(--mdp-space-6); }
.mdp-slide .mdp-compare-name { font-size: clamp(1.25rem, 2.6vw, 1.75rem); }

${FLOW_STYLE}

/* On a slide the flow chips read at presentation scale. */
.mdp-slide .mdp-flow { gap: var(--mdp-space-4); }
.mdp-slide .mdp-flow-step { font-size: clamp(1rem, 2vw, 1.375rem); }
.mdp-slide .mdp-flow-arrow { font-size: clamp(1rem, 2vw, 1.375rem); }

${CALLOUT_STYLE}

${TABLE_STYLE}

${CHART_STYLE}

${DIAGRAM_STYLE}

${TIMELINE_STYLE}

${FAQ_STYLE}

${PRICING_STYLE}

/* On a slide the callout body reads at presentation scale. */
.mdp-slide .mdp-callout { padding: var(--mdp-space-6); }
.mdp-slide .mdp-callout-p { font-size: clamp(1.0625rem, 2vw, 1.375rem); }

/* Keyboard hint in the chrome, hidden on narrow screens. */
.mdp-hint { font-size: var(--mdp-text-small); color: var(--mdp-ink-faint); }
@media (max-width: 48rem) { .mdp-hint { display: none; } }

/* Print to PDF: one slide per page, light, no chrome. Use Cmd or Ctrl + P. */
@media print {
  :root {
    --mdp-bg: #ffffff; --mdp-surface: #f6f6f3; --mdp-ink: #18181b;
    --mdp-ink-soft: #52525b; --mdp-ink-faint: #8a8a8f; --mdp-border: rgba(0, 0, 0, 0.10);
  }
  .mdp-chrome { display: none !important; }
  .mdp-js .mdp-slide, .mdp-slide {
    position: static !important;
    inset: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
    min-height: auto;
    border-bottom: 0;
    padding: 2rem;
    break-after: page;
    break-inside: avoid;
  }
  .mdp-slide:last-child { break-after: auto; }
  .mdp-slide .mdp-title { font-size: 2rem; }
  .mdp-slide .mdp-logo { height: 1.75rem; }
  .mdp-slide .mdp-lead { font-size: 1.25rem; }
  .mdp-slide .mdp-h2 { font-size: 1.4rem; }
  .mdp-slide .mdp-p, .mdp-slide .mdp-list { font-size: 1rem; }
  .mdp-slide .mdp-figure-value { font-size: 1.75rem; }
  .mdp-slide .mdp-quote-text { font-size: 1.4rem; }
  @page { margin: 1.5cm; }
}`;

// The stepper. Plain ES5-ish DOM code, no dependencies, runs inline. Pure with
// respect to content; no Date/Math.random.
const SLIDES_SCRIPT = `(function () {
  var deck = document.querySelector('.mdp-deck');
  if (!deck) return;
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.mdp-slide'));
  if (slides.length === 0) return;

  document.documentElement.classList.add('mdp-js');

  var chrome = document.querySelector('.mdp-chrome');
  var prevBtn = document.querySelector('[data-mdp="prev"]');
  var nextBtn = document.querySelector('[data-mdp="next"]');
  var counter = document.querySelector('[data-mdp="counter"]');
  var dotsWrap = document.querySelector('.mdp-dots');
  var fullBtn = document.querySelector('[data-mdp="full"]');
  var dots = [];

  var index = 0;
  var total = slides.length;

  // Build dots.
  for (var i = 0; i < total; i++) {
    var dot = document.createElement('button');
    dot.className = 'mdp-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    (function (n) {
      dot.addEventListener('click', function (e) { e.stopPropagation(); go(n); });
    })(i);
    dotsWrap.appendChild(dot);
    dots.push(dot);
  }

  function clamp(n) { return Math.max(0, Math.min(total - 1, n)); }

  function render() {
    for (var i = 0; i < total; i++) {
      var active = i === index;
      slides[i].classList.toggle('is-active', active);
      slides[i].setAttribute('aria-hidden', active ? 'false' : 'true');
      dots[i].classList.toggle('is-active', active);
      dots[i].setAttribute('aria-current', active ? 'true' : 'false');
    }
    counter.textContent = (index + 1) + ' / ' + total;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
  }

  function go(n) { index = clamp(n); render(); }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
  if (fullBtn) {
    fullBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });
    document.addEventListener('fullscreenchange', function () {
      fullBtn.textContent = document.fullscreenElement ? 'Exit' : 'Full';
    });
  }

  // Click anywhere on the stage advances; clicks on chrome are ignored above.
  deck.addEventListener('click', function (e) {
    if (chrome && chrome.contains(e.target)) return;
    next();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { prev(); e.preventDefault(); }
    else if (e.key === 'Home') { go(0); e.preventDefault(); }
    else if (e.key === 'End') { go(total - 1); e.preventDefault(); }
    else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); e.preventDefault(); }
  });

  render();
})();`;

// Render the inner markup for one slide's blocks. The title slide is composed
// separately; this handles heading/list/stats/quote/paragraph slides.
function renderSlideBlock(block) {
  switch (block.type) {
    case "heading":
      return `<h2 class="mdp-h2">${inline(block.text)}</h2>`;

    case "lead":
      return `<p class="mdp-lead">${inline(block.text)}</p>`;

    case "paragraph":
      return `<p class="mdp-p">${inline(block.text)}</p>`;

    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map((it) => `<li>${inline(it)}</li>`)
        .join("\n");
      return `<${tag} class="mdp-list">\n${items}\n</${tag}>`;
    }

    case "stats": {
      const figs = block.items
        .map(
          (s) =>
            `<div class="mdp-figure"><span class="mdp-figure-value">${inline(
              s.value
            )}</span><span class="mdp-figure-label">${inline(
              s.label
            )}</span></div>`
        )
        .join("\n");
      return `<div class="mdp-figures">\n${figs}\n</div>`;
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

function slide(inner, n) {
  return (
    `<section class="mdp-slide" aria-roledescription="slide" aria-label="Slide ${n}">\n` +
    `<div class="mdp-slide-inner">\n${inner}\n</div>\n` +
    `</section>`
  );
}

export function renderSlides(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);

  const slidesHtml = [];
  let n = 1;

  // Title slide first.
  const titleInner =
    renderLogo(deriveLogo(ir), title || docTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(title || docTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>` : "");
  slidesHtml.push(slide(titleInner, n++));

  // One slide per remaining section.
  for (const section of rest) {
    const inner = section.blocks
      .map(renderSlideBlock)
      .filter(Boolean)
      .join("\n");
    if (inner.trim()) {
      slidesHtml.push(slide(inner, n++));
    }
  }

  const chrome =
    `<div class="mdp-chrome">\n` +
    `<span class="mdp-hint">arrows or space to move, F for fullscreen, print for PDF</span>\n` +
    `<div class="mdp-dots" role="tablist" aria-label="Slides"></div>\n` +
    `<div class="mdp-nav">\n` +
    `<button class="mdp-btn" type="button" data-mdp="prev" aria-label="Previous slide">Prev</button>\n` +
    `<span class="mdp-counter" data-mdp="counter" aria-live="polite"></span>\n` +
    `<button class="mdp-btn" type="button" data-mdp="next" aria-label="Next slide">Next</button>\n` +
    `<button class="mdp-btn" type="button" data-mdp="full" aria-label="Toggle fullscreen">Full</button>\n` +
    `</div>\n` +
    `</div>`;

  const body =
    `<div class="mdp-deck">\n${slidesHtml.join("\n")}\n</div>\n${chrome}`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: SLIDES_STYLE,
    body,
    script: SLIDES_SCRIPT,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
