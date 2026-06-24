# Contributing to MDP

Thanks for helping. MDP is small on purpose: a dependency-free engine that
compiles one `.mdp` source into design-locked artifacts. The bar for a change is
that it keeps the engine pure and keeps the look locked.

## Build and run

No install. Plain Node ESM, Node 18 or newer.

```
git clone https://github.com/barmoshe/mdp
cd mdp
node packages/core/build.mjs examples/block-compare.mdp
```

That writes one HTML file per artifact into `dist/` (`page.html`, `slides.html`,
`flyer.html`, and, when a source opts into them, `report.html`, `onepager.html`,
`memo.html`, `letter.html`). Open them in a browser. Pass any `.mdp` path to
compile a different source; the full set of probes lives in `examples/` (indexed
in `examples/README.md`), and fill-in starters in `templates/`.

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
5. Wire the node into the three per-form renderers (`render-page.mjs`,
   `render-slides.mjs`, `render-flyer.mjs`): add a `case` and inject your `STYLE`
   where the other block styles are injected.
6. Wire it into the shared interactive renderer too, `src/content-blocks.mjs`: add
   the same `case` to `renderContentBlock`, and add your `STYLE` to the
   `CONTENT_BLOCK_STYLE` array. That one file covers all five interactive forms
   (scroll, accordion, tabs, stepper, plan); a block wired only into page/slides/flyer
   renders blank in them.
7. Update `spec/schema.json` and `SPEC.md` once the shape settles.

## Extensions

Core ships a curated block set. Anything beyond it lives in **its own repo** and
is discovered the zero-maintenance way: a naming convention plus an npm keyword
plus a GitHub topic, found through npm and GitHub search with no central registry
to maintain (the model `eslint-plugin-*` and `slidev-theme-*` use).

**Scaffold one in one command** (it sets everything below for you):

```sh
npm create mdp-extension my-block                       # a block
npm create mdp-extension my-thing -- --type artifact    # an artifact
# or: npx create-mdp-extension my-block
```

The tool lives in
[`packages/create-mdp-extension`](packages/create-mdp-extension).

**Naming.** `mdp-block-<name>` for a block, `mdp-artifact-<name>` for an artifact,
plus the scoped `@scope/mdp-block-<name>` forms.

**Discovery.** Require these so search finds the package from day one:

- npm `keywords`: `["mdp", "mdp-block"]` (or `"mdp-artifact"`), listed by
  `npm search keywords:mdp-block`;
- a GitHub **topic** of `mdp-block` (or `mdp-artifact`) on the repo.

**Block shape.** A third-party block follows
[`packages/core/src/compare.mjs`](packages/core/src/compare.mjs): a module that
exports a `STYLE` string (design tokens only, logical properties) and a
`render<Name>(block)` that passes every author string through `inline()`. The
in-core wiring an author or host then does is the
[Adding a new block](#adding-a-new-block) steps above.

**Licensing.** The scaffold defaults to MIT and can emit Apache-2.0
(`--license apache-2.0`); third parties are free to choose any license. Core
itself is Apache-2.0.

**Using a third-party extension.** `mdp-compiler` has no runtime plugin loader yet,
by design (the zero-maintenance bet). To render a third-party block or artifact in
a real document you fork or patch core: for a block, teach `parse.mjs` the fence,
add a `case` (plus the `STYLE`) to the three per-form renderers AND to the shared
`content-blocks.mjs` (which covers the four interactive forms); for an artifact, add
a `RENDERERS` entry. Each generated package's README spells out the exact lines.

## Code style

- Plain ESM (`.mjs`). No dependencies, no build step, no bundler.
- **Deterministic.** The render path is pure: no `Date.now()`, no
  `Math.random()`, no clocks, stable iteration order. Two builds of the same
  source must produce byte-identical files. Anything that breaks this is a bug.

## Pull requests

Before opening a PR, confirm:

- Every `examples/*.mdp` and `templates/*.mdp` builds and is byte-identical
  across two runs (CI loops over the dirs), and `npm run check:examples` passes.
  If you add or rename a seed, update its `manifest.json` and run `npm run
  gen:docs`.
- Output is deterministic: build twice, the HTML is identical.
- The **design lock holds**: no gradients, no shadows, one ink ramp, two
  weights. Hierarchy comes from type size, weight, and whitespace. A second
  accent color needs an ADR, not a PR.
- Spec and docs are updated if the format changed.
- If you changed the engine, re-sync the vendored copies so they match
  `packages/core/`: `npm run sync:codex` (the Codex plugin) and
  `npm run sync:mcp` (the `packages/mcp` server). CI fails if either is stale.

Keep PRs focused and the diff small. Friendly review, fast merges.
