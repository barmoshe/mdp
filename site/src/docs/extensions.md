# Build an extension

MDP grows in two open units, and both keep the design lock intact:

- A **block** is new typed content (a status pill, a spec sheet, a chart) that
  every form can render. It is a small module exporting a `STYLE` string and a
  `render<Name>(block)` function.
- An **artifact** is a whole new output type (a resume, a changelog) as a solver
  over the same parsed tree. It exports a `render<Name>(ir)` that returns a complete
  HTML document.

The author writes meaning; the extension author builds the design. There is no
runtime plugin loader, by design: discovery is a naming convention plus an npm
keyword plus a GitHub topic, found through search with nothing central to maintain.

See these live, with their source, in the [extension examples](#extensions) on the
home page. The worked code below is `mdp-block-status`.

## Scaffold one

```sh
npm create mdp-extension my-block                    # a block
npm create mdp-extension my-thing -- --type artifact # an artifact
```

It generates a zero-dependency package with the right name and keywords, a render
module, a vendored escaper, tests, and a `demo.mjs` that writes a preview you can
open. Edit `src/index.mjs` to make it yours.

## A block, end to end

A block module exports its CSS and a pure render function. Use the design tokens
only (no literal colors), use logical properties so it flips under right-to-left,
and run every author string through `inline()` so it is escaped:

```js
import { inline } from "./_inline.mjs";

export const STATUS_STYLE = `.mdp-status { display: flex; gap: var(--mdp-space-2); }
.mdp-status-pill {
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 999px;
  padding-block: var(--mdp-space-1);
  padding-inline: var(--mdp-space-3);
  color: var(--mdp-ink-soft);
}`;

export function renderStatus(block) {
  const pills = (block.items || [])
    .map((it) => `<span class="mdp-status-pill">${inline(it.label)}</span>`)
    .join("\n");
  return `<div class="mdp-status">\n${pills}\n</div>`;
}
```

### Wire it into the engine (all of it)

The host turns a fence into the IR node and renders it. Wiring a block touches
**three** places, and the third is the one that is easy to miss:

1. **Parse**, in `packages/core/src/parse.mjs`: emit the node for your fence (model
   it on the `mdp:flow` branch).
2. **The per-form renderers**, in each of `render-page.mjs`, `render-slides.mjs`,
   and `render-flyer.mjs`: import the package, add a `case` to the block switch, and
   inject the `STYLE`.
3. **The shared interactive renderer**, in `packages/core/src/content-blocks.mjs`:
   add the same `case` to `renderContentBlock`, and add the `STYLE` to the
   `CONTENT_BLOCK_STYLE` array. That single file renders the block in all four
   interactive forms (scroll, accordion, tabs, stepper). A block wired only into
   page, slides, and flyer renders blank in those four.

An unknown fence already degrades to readable text, so an un-wired block never
breaks a document.

## An artifact, end to end

An artifact owns the whole document, so it is simpler to wire: there is nothing to
add to the per-form renderers or to `content-blocks.mjs`. It runs standalone as
`renderResume(parse(source))`, or you add one entry to the `RENDERERS` map in
`packages/core/src/index.mjs` so the CLI and the playground can target it by name:

```js
import { renderResume } from "mdp-artifact-resume";

export const RENDERERS = {
  page: renderPage,
  slides: renderSlides,
  flyer: renderFlyer,
  // ...
  resume: renderResume,
};
```

## Publish and be found

Discovery needs no registry:

1. Keep the `keywords` the scaffolder set: `["mdp", "mdp-block"]` for a block, or
   `["mdp", "mdp-artifact"]` for an artifact.
2. `npm publish`.
3. Add the matching GitHub **topic** (`mdp-block` or `mdp-artifact`) to the repo.

Your package is then found by `npm search keywords:mdp-block` and the GitHub topic
page, the same convention `eslint-plugin-*` and `slidev-theme-*` use.

## The examples

The repo ships a curated set under
[`extensions/`](https://github.com/barmoshe/mdp/tree/main/extensions): two blocks
(`mdp-block-status`, `mdp-block-spec-sheet`) and an artifact (`mdp-artifact-resume`).
Each is a faithful, self-contained package you can clone and run offline. Read one
next to its README to see the whole shape.
