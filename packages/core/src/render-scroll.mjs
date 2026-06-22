// render-scroll.mjs: the `scroll` artifact: a scroll-driven narrative.
//
// The title + {.lead} compose a tall hero; each `---`-delimited section is a
// "scene" that reveals as it scrolls into view. A fixed progress bar tracks
// reading position and a dot rail jumps between scenes. The scrollytelling
// reading form: a complement to slides (click-paced) and page (plain scroll).
// With JS off, every scene is visible and the page scrolls normally; motion is
// disabled under prefers-reduced-motion.

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
import { renderContentBlocks, CONTENT_BLOCK_STYLE } from "./content-blocks.mjs";

const SCROLL_STYLE = `.mdp-scroll-body {
  max-width: 44rem;
  margin: 0 auto;
  padding: 0 var(--mdp-space-5);
}

.mdp-scene {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2rem, 8vh, 5rem) 0;
}
.mdp-scene > * + * { margin-top: var(--mdp-space-4); }

.mdp-scene-hero { min-height: 85vh; }
.mdp-scene-hero .mdp-eyebrow { margin-bottom: var(--mdp-space-5); }
.mdp-scene-hero .mdp-title {
  font-size: clamp(2.5rem, 6vw, 3.75rem);
  letter-spacing: -0.02em;
}
.mdp-scene-hero .mdp-lead { font-size: var(--mdp-text-lead); }
.mdp-scene-hero .mdp-logo { margin-block-end: var(--mdp-space-6); }

/* Fixed reading-progress bar across the top. */
.mdp-scroll-progress {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  height: 3px;
  z-index: 20;
}
.mdp-scroll-progress-bar {
  display: block;
  height: 100%;
  width: 0;
  background: var(--mdp-accent);
  transition: width 80ms linear;
}

/* Dot rail down the side; built by JS, so hidden without it and on narrow. */
.mdp-scroll-rail {
  position: fixed;
  inset-inline-end: clamp(0.5rem, 2vw, 1.25rem);
  inset-block-start: 50%;
  transform: translateY(-50%);
  display: none;
  flex-direction: column;
  gap: var(--mdp-space-2);
  z-index: 20;
}
.mdp-js .mdp-scroll-rail { display: flex; }
.mdp-scroll-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--mdp-ink-faint);
  opacity: 0.35;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: opacity 140ms ease, background 140ms ease, transform 140ms ease;
}
.mdp-scroll-dot.is-active { opacity: 1; background: var(--mdp-accent); transform: scale(1.3); }
.mdp-scroll-dot:focus-visible { outline: 2px solid var(--mdp-accent-border); outline-offset: 3px; }

/* Reveal-on-scroll, only when JS is on. The hero ships pre-revealed (no flash). */
.mdp-js .mdp-scene {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 700ms ease, transform 700ms ease;
}
.mdp-js .mdp-scene.is-revealed { opacity: 1; transform: none; }

@media (max-width: 40rem) {
  .mdp-js .mdp-scroll-rail { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .mdp-js .mdp-scene { opacity: 1; transform: none; transition: none; }
  .mdp-scroll-dot, .mdp-scroll-progress-bar { transition: none; }
}

${CONTENT_BLOCK_STYLE}`;

// Scroll driver: progress bar, a dot rail (one per scene), reveal-on-enter, and
// active-scene tracking via IntersectionObserver. Falls back to revealing all
// scenes when the observer or reduced motion rules it out. Pure (no clocks, no
// randomness); dot labels number the scenes.
const SCROLL_SCRIPT = `(function () {
  var root = document.querySelector('.mdp-scroll');
  if (!root) return;
  document.documentElement.classList.add('mdp-js');
  var scenes = Array.prototype.slice.call(root.querySelectorAll('.mdp-scene'));
  var bar = root.querySelector('[data-mdp="bar"]');
  var rail = root.querySelector('.mdp-scroll-rail');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight - doc.clientHeight) || 1;
    var top = doc.scrollTop || window.pageYOffset || 0;
    var pct = Math.max(0, Math.min(1, top / max));
    if (bar) bar.style.width = (pct * 100) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  var dots = [];
  if (rail) {
    for (var i = 0; i < scenes.length; i++) {
      var dot = document.createElement('button');
      dot.className = 'mdp-scroll-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Go to section ' + (i + 1));
      (function (n) {
        dot.addEventListener('click', function () {
          scenes[n].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
      })(i);
      rail.appendChild(dot);
      dots.push(dot);
    }
  }

  if (reduce || !('IntersectionObserver' in window)) {
    for (var r = 0; r < scenes.length; r++) scenes[r].classList.add('is-revealed');
    if (dots[0]) dots[0].classList.add('is-active');
    return;
  }

  var revealObs = new IntersectionObserver(function (entries) {
    for (var e = 0; e < entries.length; e++) {
      if (entries[e].isIntersecting) {
        entries[e].target.classList.add('is-revealed');
        revealObs.unobserve(entries[e].target);
      }
    }
  }, { rootMargin: '0px 0px -15% 0px', threshold: 0.1 });
  for (var s = 0; s < scenes.length; s++) revealObs.observe(scenes[s]);

  var activeObs = new IntersectionObserver(function (entries) {
    for (var e2 = 0; e2 < entries.length; e2++) {
      if (entries[e2].isIntersecting) {
        var idx = scenes.indexOf(entries[e2].target);
        for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('is-active', d === idx);
      }
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  for (var s2 = 0; s2 < scenes.length; s2++) activeObs.observe(scenes[s2]);
})();`;

export function renderScroll(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);
  const mastheadTitle = title || docTitle;

  // The hero scene ships pre-revealed so there is no blank flash before JS runs.
  const hero =
    `<section class="mdp-scene mdp-scene-hero is-revealed">\n` +
    renderLogo(deriveLogo(ir), mastheadTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(mastheadTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</section>`;

  const scenes = rest
    .map(
      (section) =>
        `<section class="mdp-scene">\n${renderContentBlocks(section.blocks)}\n</section>`
    )
    .join("\n");

  const progress =
    `<div class="mdp-scroll-progress" aria-hidden="true">` +
    `<span class="mdp-scroll-progress-bar" data-mdp="bar"></span></div>`;
  const railNav = `<nav class="mdp-scroll-rail" aria-label="Sections"></nav>`;

  const body =
    `<div class="mdp-scroll">\n${progress}\n${railNav}\n` +
    `<article class="mdp-scroll-body">\n${hero}\n${scenes}\n</article>\n</div>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: SCROLL_STYLE,
    body,
    script: SCROLL_SCRIPT,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
