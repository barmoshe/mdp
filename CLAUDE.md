# CLAUDE.md

Orientation for an AI coding assistant working in this repo. It collects the
codebase map, the workflows, and the rules that get a change rejected. It does
not replace the canonical docs: [AGENTS.md](AGENTS.md) is the machine-facing
build/extend guide, [CONTRIBUTING.md](CONTRIBUTING.md) is the contribution bar,
[SPEC.md](SPEC.md) is the format, and [VISION.md](VISION.md) is the why. When
this file and one of those disagree, the specialized doc wins; fix the drift.

## What MDP is

MDP (Markdown Presentation) is a presentation compiler for AI-written content.
One declarative `.mdp` source compiles, deterministically, into several
design-locked HTML artifacts: a `page`, a `slides` deck, a `flyer`, a `report`,
a one-pager (`onepager`), a `memo`, and a `letter`. The
author (a person or an agent) writes meaning; the engine owns all design, so the
output cannot look junky. It is a compiler, not a viewer and not live AI.

The data flow is one direction:

```
.mdp source  ->  parse()  ->  IR { meta, blocks }  ->  render(ir)  ->  HTML
```

The IR is the semantic representation every artifact solves against. Each
artifact is a solver, not a template.

## Prime directives (these are what break CI)

1. **Determinism is a hard rule.** The render path must be pure: no `Date.now()`,
   no `Math.random()`, no clocks, no ambient state, stable iteration order. Two
   builds of the same source must be byte-identical. CI diffs sha256 across two
   runs of every seed; any difference fails.
2. **The design lock holds.** `packages/core/src/tokens.mjs` is the single source
   of the look: two font families, two weights, one ink ramp plus one restrained
   accent per theme, light and dark, no gradients, no shadows. The source format
   carries zero styling (no color, size, or font). Hierarchy comes from type
   size, weight, and whitespace. A second accent color needs an ADR, not a PR.
3. **The core engine stays dependency-free.** `packages/core` is plain Node ESM
   (`.mjs`), no install, no build step, no bundler. The only packages with deps
   are `packages/mcp` (the MCP SDK + zod) and `site` (Vite + React); never pull a
   dependency into the core.
4. **Vendored copies must stay in sync.** The engine is copied into `codex/` and
   into `packages/mcp/`. After any engine change, re-sync both (see below). CI
   fails if either copy is stale. The copies are never a second source of truth.

## Repo map

```
mdp/
  packages/core/          mdp-compiler, the engine (zero-dependency, the source of truth)
    build.mjs             CLI: read a source, compile artifacts, write dist/ (or --open)
    src/
      parse.mjs           source string -> IR { meta, blocks }
      inline.mjs          inline markdown -> escaped, link-safe HTML (escapeHtml, inline)
      tokens.mjs          the locked design system + the 11 themes, as CSS
      shared.mjs          doc scaffold + section helpers shared by every renderer
      render-page.mjs     the page artifact solver
      render-slides.mjs   the slides artifact solver
      render-flyer.mjs    the flyer artifact solver
      callout.mjs         the :::callout block (STYLE + render)
      compare.mjs         the mdp:compare block (the model to copy for new blocks)
      flow.mjs            the mdp:flow block
      schema.mjs          the versioned JSON Schema for the IR (SCHEMA, SCHEMA_VERSION)
      index.mjs           public API: compile(), parse(), RENDERERS, ARTIFACTS, tokens
  packages/mcp/           mdp-mcp: the MCP server, published to npm (self-contained)
    src/                  server, tools (mdp_compile / mdp_present / mdp_validate), io
    engine/               VENDORED copy of packages/core/src (do not edit by hand)
    assets/               VENDORED SPEC + example/template seeds
    test.mjs              the server smoke test (npm test inside packages/mcp)
  codex/                  the Codex plugin (self-contained)
    .codex-plugin/        plugin.json
    skills/mdp/           the mdp skill (SKILL.md)
    packages/core/        VENDORED copy of the engine (do not edit by hand)
    bin/, SPEC.md, examples/   VENDORED CLI + spec + seed example
  commands/mdp.md         the Claude Code /mdp command (the repo root IS the plugin)
  .claude-plugin/         plugin.json + marketplace.json (Claude Code plugin manifest)
  site/                   the hub + live playground (Vite + React); bundles packages/core
  scripts/                checks and generators (see Commands)
  examples/               example probes + manifest (manifest.json / manifest.mjs)
  templates/              fill-in document starters + manifest
  spec/schema.json        GENERATED from packages/core/src/schema.mjs (do not hand-edit)
  bin/mdp, bin/mdp.cmd    thin wrappers that exec packages/core/build.mjs
  dist/                   build output (git-ignored)
  .github/workflows/      ci.yml (gates) + pages.yml (deploy site to GitHub Pages)
```

### Three plugin surfaces, one engine

The same engine ships to agent tools three ways. None of them adds anything to
the format; each authors `.mdp`, runs the engine, and shows the result.

- **Claude Code** (this repo is the marketplace): the repo root is the plugin.
  `.claude-plugin/` plus a single `/mdp` command in `commands/mdp.md`, which runs
  the engine in place at `packages/core/`.
- **Codex**: a self-contained plugin in `codex/`, engine vendored in, an `mdp`
  skill. Lives in its own folder so Codex and Claude each see exactly one `mdp`
  component.
- **MCP server**: `packages/mcp` (`mdp-mcp`), run via `npx -y mdp-mcp`, exposing
  `mdp_compile`, `mdp_present`, `mdp_validate` and `mdp://spec` + `mdp://example/*`
  resources to any MCP host.

## The engine API

`packages/core/src/index.mjs` is the public surface every consumer (CLI, MCP,
playground) calls:

- `compile(source, artifact = "page")` -> complete HTML document string.
- `parse(source)` -> the IR `{ meta, blocks }`.
- `RENDERERS` (keyed by name) and `ARTIFACTS` (`["page", "slides", "flyer", "report", "onepager", "memo", "letter"]`).
- `inline`, `escapeHtml` from `inline.mjs`.
- `baseStyle`, `themeTokens`, `BASE`, `THEMES`, `DEFAULT_THEME`, `THEME_SWATCHES`
  from `tokens.mjs`.
- `SCHEMA`, `SCHEMA_VERSION` from `schema.mjs`.

The 11 themes: `studio` (default, indigo), `ocean`, `teal`, `forest`, `amber`,
`terracotta`, `coral`, `rose`, `plum`, `violet`, `mono`. Every theme passes
WCAG AA in light and dark, verified by `npm test`.

## Commands

Run from the repo root unless noted. No install needed for the engine.

```bash
# Build all three artifacts from a source into dist/ (default source: examples/block-compare.mdp)
node packages/core/build.mjs examples/block-compare.mdp
npm run build                                   # same, default source

# Compile + open one artifact in the browser (side effect only; does not change output bytes)
node packages/core/build.mjs <file.mdp> --open slides
# flags: [--out <dir>] [--only <artifact>] [--theme <name>] [--open [artifact]]

npm test            # the full gate: check-contrast + check-logo + check-examples + check-schema
npm run check:examples   # drift gate: manifests match disk, roles clean, feature coverage complete
npm run check:schema     # every seed's IR validates against the versioned schema

npm run gen:docs    # regenerate the examples/README table from the .mdp files (commit the result)
npm run gen:schema  # regenerate spec/schema.json from src/schema.mjs (commit the result)

npm run sync:codex  # refresh the vendored engine copy in codex/        (commit the result)
npm run sync:mcp    # refresh the vendored engine + assets in packages/mcp/ (commit the result)
```

Site (the hub + playground, has its own deps):

```bash
cd site && npm install
npm run dev         # local Vite dev server, bundles the real engine from packages/core
npm run build       # production bundle (CI builds this)
npm run typecheck   # tsc --noEmit
```

MCP server (has its own deps):

```bash
cd packages/mcp && npm install
npm test            # smoke test the server
```

## Common workflows

**Change the engine in any way -> re-sync the vendored copies.** This is the most
common mistake. After editing anything under `packages/core/`, `bin/`, `SPEC.md`,
or the seeds, run `npm run sync:codex` and `npm run sync:mcp` and commit the
updated `codex/` and `packages/mcp/{engine,assets}`. Never edit those vendored
trees by hand.

**Add a new block** (model: `src/compare.mjs`). Full steps in
[CONTRIBUTING.md](CONTRIBUTING.md#adding-a-new-block) and
[AGENTS.md](AGENTS.md). In short: create `packages/core/src/<name>.mjs` exporting
a `STYLE` string and `render<Name>(block)`; pass every author string through
`inline()` so it is escaped and link schemes are defanged; use monochrome tokens
only (`var(--mdp-ink)`, the spacing scale, never literal colors); use logical CSS
(`margin-inline-start`, never `left`/`right`) so it flips under `dir="rtl"`; teach
`parse.mjs` to emit the typed node (an unknown directive must degrade to readable
text, never throw or blank); wire it into all three `render-*.mjs`; update
`spec/schema.json` (via `gen:schema`) and `SPEC.md` once the shape settles; then
re-sync the vendored copies.

**Add a new artifact renderer.** Create `src/render-<name>.mjs` exporting
`render<Name>(ir) -> htmlString`, build its layout CSS as a string, pass it to
`htmlDocument(...)` from `shared.mjs`, reuse the shared block classes, add one
entry to `RENDERERS` in `index.mjs` (the CLI and `ARTIFACTS` pick it up), keep it
pure. See [AGENTS.md](AGENTS.md) for the helper list.

**Add or rename an example/template.** Update the relevant `manifest.json`, run
`npm run gen:docs` (regenerates `examples/README.md`), confirm `npm run
check:examples` passes, and re-sync the vendored copies if the seed is vendored.

## CI gates (.github/workflows/ci.yml)

A change must pass all of these:

- **Build coverage**: every `examples/*.mdp` and `templates/*.mdp` emits all three
  artifacts.
- **Determinism**: each seed is byte-identical across two builds.
- **Theme gallery**: `examples/theme-gallery.mdp` renders under all 11 themes.
- **Drift gate**: `scripts/check-examples.mjs` (manifests match disk, role
  vocabulary clean, feature coverage complete).
- **Schema conformance + freshness**: every seed's IR validates; `spec/schema.json`
  matches `gen:schema` output.
- **Docs freshness**: `examples/README.md` matches `gen:docs` output.
- **Codex + MCP freshness**: `codex/` matches `sync:codex`; `packages/mcp/{engine,
  assets}` matches `sync:mcp`.
- **Site job**: `site/` typechecks and bundles.
- **MCP job**: vendored tree is fresh, deps install, smoke test passes.

`pages.yml` deploys `site/` to GitHub Pages on every push to `main` that touches
`site/`, `packages/core/`, or the workflow.

## The .mdp format (crib)

Full grammar in [SPEC.md](SPEC.md). No styling ever goes in the source.

````text
---
mdp: 1
forms: [page, slides, flyer]
title: A clear title
kicker: Optional eyebrow label
theme: studio
brand-accent: #2f8f6b        # optional: one brand hex; the engine derives the accent set
lang: en
dir: ltr
---

# A clear title
{.lead} A one-line standfirst under the title.

## A section heading

```mdp:flow
Collect data -> The model writes the summary -> Send one message
```

:::callout recommendation
A note, tip, cost, recommendation, or warning aside.
:::
````

- `# Title`, then `{.lead}` standfirst; `## Heading` starts a section; a line that
  is exactly `---` is a section or slide break.
- Lists `- ` / `1. `; quote `> ...` with optional `{.cite}` attribution.
- Fenced blocks: `mdp:stats` (`Label: value` lines), `mdp:compare` (each option is
  `# Name` plus `badge:`, `note:`, `cta: [text](url)`, and `- ` pros), `mdp:flow`
  (steps joined by `->`).
- Right-to-left: set `lang: he` (or `ar`, `fa`) and `dir: rtl`; the layout flips.

## Conventions and gotchas

- Plain ESM (`.mjs`) in the engine. Node 18+ (CI runs the engine on Node 20; the
  site on Node 22).
- Escape everything author-supplied through `inline()` / `escapeHtml()`. Link
  schemes are defanged; do not bypass this and never hand-write HTML into the IR.
- Logical CSS only in any block or renderer so RTL works for free.
- Unknown directives and malformed input degrade to readable text; the engine
  never throws on bad source.
- `dist/` and `node_modules/` are git-ignored. `spec/schema.json`,
  `examples/README.md`, and the vendored trees are generated/copied: change the
  source, then regenerate, then commit.
- The provenance of design decisions (for example "why one accent per theme") is
  recorded in ADRs; when a change touches the design lock or the format, expect to
  write or cite one rather than just opening a PR.
