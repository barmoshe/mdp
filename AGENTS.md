# AGENTS.md

Machine-facing build and contribution guide for the MDP engine. (A thin
`CLAUDE.md` can point here later; see OPEN-SOURCE.md for the convention.)

## What this is

MDP compiles one declarative `.mdp` source into several design-locked HTML
artifacts. The design lives in the engine, not the source: authors write
meaning, the renderer guarantees the look.

## Build and run

- No dependencies. Plain Node ESM (`.mjs`). Runs with `node` directly, no
  install, no build step, no bundler.
- Build all artifacts: `node packages/core/build.mjs` (or `npm run build` /
  `pnpm build` from the repo root).
- Compile a different source: `node packages/core/build.mjs path/to/file.mdp`.
- Output: `dist/page.html`, `dist/slides.html`, `dist/flyer.html` at the repo
  root.

## Determinism (a hard rule)

The render path must be pure: no `Date.now()`, no `Math.random()`, no clocks,
stable iteration order. Running the build twice must produce byte-identical
files. Any change that breaks this is a bug.

## Package layout

```
mdp/
  packages/core/            @mdp/core, the engine
    src/
      parse.mjs             source string  -> IR { meta, blocks }
      inline.mjs            inline markdown -> escaped, safe HTML
      tokens.mjs            the locked "studio" design system, as CSS
      shared.mjs            doc scaffold + section helpers shared by renderers
      render-page.mjs       the `page` artifact solver
      render-slides.mjs     the `slides` artifact solver
      render-flyer.mjs      the `flyer` artifact solver
      index.mjs             exports parse() and compile(source, artifact)
    build.mjs               CLI: read a source, compile all artifacts, write dist
  spec/schema.json          JSON Schema for the .mdp frontmatter (stub)
  examples/tidewater.mdp    the sample source
```

The data flow is one direction: `source string -> parse() -> IR -> render() ->
HTML`. The IR (`{ meta, blocks }`) is the semantic representation every artifact
solves against. See `src/parse.mjs` for the node types.

## The design lock

`src/tokens.mjs` is the single source of the look: two font families, two
weights, one neutral ink ramp, light + dark, no gradients or shadows. Every
renderer imports `baseStyle()` and shares the same block primitives (eyebrow,
lead, headings, lists, stats, quote, hairline). Do not add per-element styling
to the source format, and do not introduce a second accent colour without an
ADR. Hierarchy comes from type size, weight, and whitespace.

## How to add a new artifact renderer

1. Create `packages/core/src/render-<name>.mjs` exporting
   `render<Name>(ir) -> htmlString`. Import `inline` from `inline.mjs` and the
   helpers from `shared.mjs` (`htmlDocument`, `deriveTitle`, `deriveEyebrow`,
   `splitSections`, `extractMasthead`, `sectionHeading`).
2. Build the artifact's own layout CSS as a string and pass it to
   `htmlDocument({ title, style, body, script })`. Reuse the shared block
   classes (`.mdp-h2`, `.mdp-list`, `.mdp-figures`, `.mdp-quote`, ...) so the
   form stays consistent with the others. Only add layout, never new colours or
   fonts.
3. Register it in `src/index.mjs`: add one entry to `RENDERERS`
   (`<name>: render<Name>`). `ARTIFACTS` and the CLI pick it up automatically.
4. Keep the render pure (see Determinism). Solve the IR; never reach back to
   the raw source or to any external state.

## How to add a new block type

1. Teach `src/parse.mjs` to emit a new typed node. Unknown directives must
   degrade to readable text, never throw or blank.
2. Handle the new node in each `render-*.mjs` (and add shared CSS to
   `tokens.mjs` if the primitive is cross-artifact).
3. Update `spec/schema.json` and the SPEC once the shape settles.
