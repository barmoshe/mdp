# Architecture

The rendering method is **deterministic composition over a semantic
representation**, not templates and not live AI. It is a fusion of three proven
ideas into one publishable substrate.

## The pipeline

Data flows one direction:

```text
source string  ->  parse()  ->  IR { meta, blocks }  ->  render()  ->  HTML
```

1. **A declarative source.** Markdoc-shaped: typed tags filled with data, no
   arbitrary code. That keeps it agent-emittable, statically checkable, and safe.
2. **A semantic representation.** The source parses into a tree of typed meaning:
   a lead, a hero stat, a quote, a call to action, a section. Intent, not layout.
   This intermediate representation, `{ meta, blocks }`, is what every artifact
   solves against.
3. **Deterministic composition.** Each artifact is a solver, not a template. It
   lays the meaning out against locked design tokens and reflows so it cannot look
   bad, but it is compiled once and is reproducible.
4. **AI authors, the engine composes.** The AI works at authoring time, writing
   the source. The render path is pure: the same source produces the same output
   every time.

Pandoc proved one source to many outputs. Gamma proved a reflow engine that
cannot look bad. Markdoc proved a safe declarative tree with no code. Each proved
one leg. MDP builds all three into a substrate.

## Package layout

```text
mdp/
  packages/core/            @mdp/core, the engine
    src/
      parse.mjs             source string  -> IR { meta, blocks }
      inline.mjs            inline markdown -> escaped, safe HTML
      tokens.mjs            the locked design system, as CSS
      shared.mjs            doc scaffold + section helpers
      render-page.mjs       the page artifact solver
      render-slides.mjs     the slides artifact solver
      render-flyer.mjs      the flyer artifact solver
      index.mjs             exports parse() and compile(source, artifact)
    build.mjs               the CLI
  commands/mdp.md           the Claude Code /mdp command
  codex/                    the Codex plugin (vendored engine)
  examples/                 sample sources
  site/                     this hub and playground
```

## Determinism is a hard rule

The render path must be pure: no `Date.now()`, no `Math.random()`, no clocks,
stable iteration order. Two builds of the same source must produce byte-identical
files. Anything that breaks this is a bug, and the CI verifies it on every push.

## Extending the substrate

MDP is open, with a two-tier design lock. Content authors write meaning only and
cannot style, so slop is impossible by construction. Extension authors build the
design, where the design actually lives. There are two extension units, both
keeping the lock intact:

- **Blocks.** New typed content, such as a chart or a timeline, that every
  artifact can render. A block is a small shared module exporting a `STYLE` string
  and a `render` function, using monochrome tokens and logical CSS so it flips
  under right-to-left automatically.
- **Artifacts.** New output types, such as a resume or a changelog, as new solvers
  over the same semantic representation. Register one entry in `RENDERERS` and the
  CLI picks it up.

Anything beyond the curated core lives in its own repo and follows a naming
convention: third-party blocks are `mdp-block-<name>`, third-party artifacts are
`mdp-artifact-<name>`. The machine-facing build guide is `AGENTS.md` in the repo,
and contribution rules are in `CONTRIBUTING.md`.
