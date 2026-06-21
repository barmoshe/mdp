# Contributing to MDP

Thanks for helping. MDP is small on purpose: a dependency-free engine that
compiles one `.mdp` source into design-locked artifacts. The bar for a change is
that it keeps the engine pure and keeps the look locked.

## Build and run

No install. Plain Node ESM, Node 18 or newer.

```
git clone https://github.com/barmoshe/mdp
cd mdp
node packages/core/build.mjs examples/tidewater.mdp
```

That writes `dist/page.html`, `dist/slides.html`, and `dist/flyer.html`. Open
them in a browser. Pass any `.mdp` path to compile a different source; there is a
second example at `examples/comparison.mdp`.

## Project layout

The engine lives in `packages/core/`:

```
packages/core/
  build.mjs           CLI: read a source, compile all artifacts, write dist/
  src/
    parse.mjs         source string -> IR { meta, blocks }
    inline.mjs        inline markdown -> escaped, safe HTML
    tokens.mjs        the locked design system, as CSS
    shared.mjs        doc scaffold + section helpers
    render-page.mjs   the page artifact
    render-slides.mjs the slides artifact
    render-flyer.mjs  the flyer artifact
    index.mjs         exports parse() and compile(source, artifact)
    stats.mjs / compare.mjs / callout.mjs / flow.mjs   the shipped blocks
```

Data flows one direction: `source -> parse() -> IR -> render() -> HTML`.

## Adding a new block

A block is a small shared module: it exports a `STYLE` string and a `render`
function, and every renderer reuses both so the block reads as one designed
component everywhere. Use `src/compare.mjs` as the model.

1. Create `packages/core/src/<name>.mjs`. Export a `STYLE` constant (the block's
   CSS, using only the design tokens, see below) and a `render<Name>(block)`
   function returning an HTML string. Pass every author-supplied string through
   `inline()` from `inline.mjs` so it is escaped and link schemes are defanged.
2. Use **monochrome tokens only**: `var(--mdp-ink)`, `var(--mdp-ink-soft)`,
   `var(--mdp-border)`, the spacing scale, and so on. No literal colors.
3. Use **logical CSS** so the block flips under `dir="rtl"`:
   `margin-inline-start`, `padding-inline-start`, `inset-inline-start`, never the
   physical `left` / `right` variants.
4. Teach `src/parse.mjs` to emit your typed node. An unknown directive must
   degrade to readable text, never throw or blank.
5. Wire the node into all three renderers (`render-page.mjs`,
   `render-slides.mjs`, `render-flyer.mjs`) and inject your `STYLE` where the
   other block styles are injected.
6. Update `spec/schema.json` and `SPEC.md` once the shape settles.

## Extensions

Core ships a curated block set. Anything beyond it lives in its own repo and
follows the naming convention:

- third-party blocks: `mdp-block-<name>`
- third-party artifacts: `mdp-artifact-<name>`

## Code style

- Plain ESM (`.mjs`). No dependencies, no build step, no bundler.
- **Deterministic.** The render path is pure: no `Date.now()`, no
  `Math.random()`, no clocks, stable iteration order. Two builds of the same
  source must produce byte-identical files. Anything that breaks this is a bug.

## Pull requests

Before opening a PR, confirm:

- Both examples still build (`tidewater.mdp` and `comparison.mdp`).
- Output is deterministic: build twice, the HTML is identical.
- The **design lock holds**: no gradients, no shadows, one ink ramp, two
  weights. Hierarchy comes from type size, weight, and whitespace. A second
  accent color needs an ADR, not a PR.
- Spec and docs are updated if the format changed.

Keep PRs focused and the diff small. Friendly review, fast merges.
