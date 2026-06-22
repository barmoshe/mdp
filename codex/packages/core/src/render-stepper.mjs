// render-stepper.mjs: the `stepper` artifact: a guided step-by-step walkthrough.
//
// Each `---`-delimited section becomes one step; its leading `##` heading names
// the step in a numbered rail. A progress bar, a "Step n of N" counter, and
// Back / Next reveal one step at a time. Distinct from slides: document-scale
// type, a persistent labeled rail, and a linear process framing rather than a
// full-screen deck. With JS off, every step is visible and stacked (numbered
// rail intact), so the walkthrough reads as a plain document.

import { inline, escapeHtml } from "./inline.mjs";
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
import {
  renderContentBlocks,
  CONTENT_BLOCK_STYLE,
  sectionParts,
} from "./content-blocks.mjs";

const STEPPER_STYLE = `.mdp-stepper {
  max-width: 48rem;
  margin: 0 auto;
  padding: var(--mdp-space-9) var(--mdp-space-5);
}

.mdp-stepper-masthead { margin-bottom: var(--mdp-space-6); }
.mdp-stepper-masthead .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-stepper-masthead .mdp-title {
  font-size: var(--mdp-text-title);
  margin-bottom: var(--mdp-space-5);
}
.mdp-stepper-masthead .mdp-lead { font-size: var(--mdp-text-lead); }

.mdp-step-rail {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mdp-space-2) var(--mdp-space-5);
  list-style: none;
  margin: 0 0 var(--mdp-space-5);
  padding: 0;
}
.mdp-step-marker { margin: 0; }
.mdp-step-dot {
  display: inline-flex;
  align-items: center;
  gap: var(--mdp-space-2);
  text-decoration: none;
  color: var(--mdp-ink-faint);
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  cursor: pointer;
}
.mdp-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 1px solid var(--mdp-border);
  color: var(--mdp-ink-faint);
  font-variant-numeric: tabular-nums;
  flex: none;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.mdp-step-dot.is-done .mdp-step-num { border-color: var(--mdp-accent); color: var(--mdp-accent-text); }
.mdp-step-dot.is-active { color: var(--mdp-ink); }
.mdp-step-dot.is-active .mdp-step-num {
  background: var(--mdp-accent);
  color: var(--mdp-accent-contrast);
  border-color: var(--mdp-accent);
}
.mdp-step-dot:focus-visible { outline: 2px solid var(--mdp-accent-border); outline-offset: 3px; border-radius: 4px; }

/* The progress track is a JS affordance; hidden until JS shows one step. */
.mdp-step-progress {
  display: none;
  height: 3px;
  background: var(--mdp-border);
  border-radius: 2px;
  margin-bottom: var(--mdp-space-6);
  overflow: hidden;
}
.mdp-js .mdp-step-progress { display: block; }
.mdp-step-progress-bar {
  display: block;
  height: 100%;
  width: 100%;
  background: var(--mdp-accent);
  transition: width 220ms ease;
}

.mdp-step > * + * { margin-top: var(--mdp-space-4); }
.mdp-step + .mdp-step { margin-top: var(--mdp-space-7); }
.mdp-js .mdp-step { display: none; }
.mdp-js .mdp-step.is-active { display: block; }
.mdp-js .mdp-step + .mdp-step { margin-top: 0; }

.mdp-step-nav {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: var(--mdp-space-4);
  margin-top: var(--mdp-space-7);
}
.mdp-js .mdp-step-nav { display: flex; }
.mdp-step-btn {
  font-family: inherit;
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 6px;
  padding: var(--mdp-space-2) var(--mdp-space-5);
  cursor: pointer;
  line-height: 1;
}
.mdp-step-btn:disabled { opacity: 0.35; cursor: default; }
.mdp-step-btn:focus-visible { outline: 2px solid var(--mdp-accent-border); outline-offset: 2px; }
.mdp-step-counter {
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-faint);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .mdp-step-num, .mdp-step-progress-bar { transition: none; }
}

${CONTENT_BLOCK_STYLE}`;

// The step controller: reveal one step at a time, drive the rail + progress bar
// + counter, prev/next, jump-by-rail, and Arrow keys. Pure (no clocks); step
// ids are derived from the step index.
const STEPPER_SCRIPT = `(function () {
  var root = document.querySelector('.mdp-stepper');
  if (!root) return;
  document.documentElement.classList.add('mdp-js');
  var steps = Array.prototype.slice.call(root.querySelectorAll('.mdp-step'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.mdp-step-dot'));
  var total = steps.length;
  if (!total) return;
  var prevBtn = root.querySelector('[data-mdp="prev"]');
  var nextBtn = root.querySelector('[data-mdp="next"]');
  var counter = root.querySelector('[data-mdp="counter"]');
  var bar = root.querySelector('[data-mdp="bar"]');
  var index = 0;

  function clamp(n) { return Math.max(0, Math.min(total - 1, n)); }
  function render() {
    for (var i = 0; i < total; i++) {
      var on = i === index;
      steps[i].classList.toggle('is-active', on);
      if (dots[i]) {
        dots[i].classList.toggle('is-active', on);
        dots[i].classList.toggle('is-done', i < index);
        if (on) dots[i].setAttribute('aria-current', 'step');
        else dots[i].removeAttribute('aria-current');
      }
    }
    if (counter) counter.textContent = 'Step ' + (index + 1) + ' of ' + total;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === total - 1;
    if (bar) bar.style.width = ((index + 1) / total * 100) + '%';
  }
  function go(n) { index = clamp(n); render(); }

  if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); });
  for (var k = 0; k < dots.length; k++) {
    (function (n) {
      dots[n].addEventListener('click', function (e) { e.preventDefault(); go(n); });
    })(k);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { go(index + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(index - 1); e.preventDefault(); }
  });
  render();
})();`;

export function renderStepper(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);
  const mastheadTitle = title || docTitle;

  const masthead =
    `<header class="mdp-stepper-masthead">\n` +
    renderLogo(deriveLogo(ir), mastheadTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(mastheadTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  const railItems = [];
  const stepStages = [];
  rest.forEach((section, i) => {
    const { label } = sectionParts(section, `Step ${i + 1}`);
    const currentAttr = i === 0 ? ` aria-current="step"` : "";
    const activeClass = i === 0 ? " is-active" : "";
    railItems.push(
      `<li class="mdp-step-marker"><a class="mdp-step-dot${activeClass}" href="#mdp-step-${i}"${currentAttr}>` +
        `<span class="mdp-step-num" aria-hidden="true">${i + 1}</span>` +
        `<span class="mdp-step-name">${inline(label)}</span></a></li>`
    );
    stepStages.push(
      `<section class="mdp-step${activeClass}" id="mdp-step-${i}" aria-label="Step ${
        i + 1
      }: ${escapeHtml(label)}">\n${renderContentBlocks(section.blocks)}\n</section>`
    );
  });

  const rail =
    `<ol class="mdp-step-rail" aria-label="Steps">\n${railItems.join("\n")}\n</ol>`;
  const progress =
    `<div class="mdp-step-progress" aria-hidden="true">` +
    `<span class="mdp-step-progress-bar" data-mdp="bar"></span></div>`;
  const stage = `<div class="mdp-step-stage">\n${stepStages.join("\n")}\n</div>`;
  const nav =
    `<div class="mdp-step-nav">\n` +
    `<button class="mdp-step-btn" type="button" data-mdp="prev" aria-label="Previous step">Back</button>\n` +
    `<span class="mdp-step-counter" data-mdp="counter" aria-live="polite"></span>\n` +
    `<button class="mdp-step-btn" type="button" data-mdp="next" aria-label="Next step">Next</button>\n` +
    `</div>`;

  const body =
    `<main class="mdp-stepper">\n${masthead}\n${rail}\n${progress}\n${stage}\n${nav}\n</main>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: STEPPER_STYLE,
    body,
    script: STEPPER_SCRIPT,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
