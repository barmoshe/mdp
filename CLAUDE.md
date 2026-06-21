# CLAUDE.md

Guidance for AI assistants working in this repository. For the human-facing
build and contribution guide, see `AGENTS.md` (this file restates the essentials
and adds the conventions an assistant most often needs). When the two ever
disagree, `AGENTS.md` and `SPEC.md` win — update this file to match.

## What MDP is

MDP compiles one declarative `.mdp` source into several **design-locked** HTML
artifacts: a `page` (calm scrolling document), `slides` (full-screen deck), and
a `flyer` (one-page surface). The core idea: **the design lives in the engine,
not the source.** Authors write meaning only; the renderer guarantees the look,
so output cannot look junky. Never put color, size, font, or any styling into a
`.mdp` source — the author picks a named `theme` and nothing more.

Data flow is strictly one direction:

```
source string  ->  parse()  ->  IR { meta, blocks }  ->  render()  ->  HTML
```

The IR is the single semantic representation every artifact solves against.

## Repository layout

```
mdp/
  packages/core/                @mdp/core — the engine (pnpm workspace package)
    src/
      index.mjs                 public entry: parse(), compile(source, artifact), RENDERERS, ARTIFACTS
      parse.mjs                 source string -> IR { meta, blocks }; hand-written line scanner
      inline.mjs                inline markdown -> escaped, safe HTML (escapeHtml, inline)
      tokens.mjs                the locked design system as CSS: BASE, THEMES, baseStyle(), themeTokens()
      shared.mjs                doc scaffold + section helpers shared by every renderer
      render-page.mjs           the `page` artifact solver
      render-slides.mjs         the `slides` artifact solver
      render-flyer.mjs          the `flyer` artifact solver
      callout.mjs               :::callout rendering + CALLOUT_VARIANTS
      compare.mjs               mdp:compare rendering
      flow.mjs                  mdp:flow rendering
    build.mjs                   the CLI: read a source, compile artifacts, write/open
    package.json                @mdp/core (version 0.0.0, type: module)
  bin/mdp, bin/mdp.cmd          thin wrappers that exec packages/core/build.mjs (used by the plugin)
  commands/mdp.md               the /mdp slash command for the Claude Code plugin
  .claude-plugin/               plugin.json + marketplace.json (Claude Code plugin manifest)
  examples/tidewater.mdp        simple launch brief (the default build source)
  examples/comparison.mdp       the full block set, includes an RTL example
  spec/schema.json              JSON Schema for the .mdp frontmatter (stub)
  SPEC.md                       the .mdp format and how a source maps to each artifact
  VISION.md                     architecture and the extensibility model
  AGENTS.md                     machine-facing build/extend guide
  llms.txt                      short index for LLMs
  .github/workflows/ci.yml      CI: builds both examples and checks determinism
```

This is a **pnpm workspace** (`pnpm-workspace.yaml` -> `packages/*`), but the
engine has **zero dependencies** and uses plain Node ESM (`.mjs`). There is no
install, no build step, no bundler, no TypeScript, no test framework.

## Build and run

```bash
node packages/core/build.mjs                          # builds examples/tidewater.mdp (default)
node packages/core/build.mjs path/to/file.mdp         # compile a different source
npm run build        # or: pnpm build                 # same as the default, from repo root
```

Output (all three artifacts) goes to `dist/page.html`, `dist/slides.html`,
`dist/flyer.html` at the repo root.

Useful CLI flags (see the header of `build.mjs`):

- `--only <page|slides|flyer>` — build just one artifact.
- `--out <dir>` — write to a chosen directory instead of `dist/`.
- `--open [artifact]` — also open the result in the default app (a side effect
  only; it never changes the output bytes). With `--open` and no `--out`, files
  go to a stable temp preview folder named after the source.

Requires Node 20 (per CI). `dist/` and `node_modules/` are gitignored.

## Determinism — a hard rule

The render path must be **pure**: no `Date.now()`, no `Math.random()`, no
clocks, no external state, stable iteration order. Running the build twice must
produce **byte-identical** files. CI enforces this (it builds `comparison.mdp`
twice and diffs the SHA-256 sums). Any change that breaks byte-stability is a
bug. `--open` is the only sanctioned side effect, and it does not touch output.

## The design lock

`src/tokens.mjs` is the single source of the look. Constraints encoded there
(do not loosen without an ADR):

- **Two font families** only (a system sans for body/UI, a serif for the lead
  and quotes) and **two weights** (400, 500). Sentence case; no ALL CAPS except
  a small letterspaced eyebrow.
- **One warm neutral ink ramp** plus **one** restrained accent. Color encodes
  meaning, never decoration, and never colors a whole surface.
- No gradients, no drop shadows, no decorative anything. Hierarchy comes from
  type size, weight, and whitespace.
- Light + dark via `prefers-color-scheme`; motion respects
  `prefers-reduced-motion`.

The author never sets a raw color — they choose a named **theme**:
`studio` (default, indigo), `teal`, `amber`, `violet`, `rose`, `mono`
(`THEMES`/`DEFAULT_THEME` in `tokens.mjs`). Every renderer imports `baseStyle()`
and shares the same block primitives, so the three forms read as one designed
system. Renderers may add **layout** CSS only — never new colors or fonts.

## The .mdp format (crib)

A `.mdp` file is valid Markdown plus a few typed blocks. No styling in the
source, ever. Full spec in `SPEC.md`; complete example in
`examples/comparison.mdp`.

Frontmatter:

```
---
mdp: 1
forms: [page, slides, flyer]
title: A clear title
kicker: Optional eyebrow label
theme: studio
lang: en
dir: ltr
---
```

Body blocks (the IR node types `parse.mjs` emits):

- `# Title` -> `title` (first H1 only); `## Heading` -> `heading` (capped at L2).
- `{.lead} text` -> `lead` (a standfirst). A bare `---` line -> `break` (section
  or slide break).
- `- item` / `1. item` -> `list` (unordered/ordered). `> text` with optional
  `{.cite} attribution` -> `quote`.
- Fenced `mdp:stats` (`Label: value` lines) -> `stats`.
- Fenced `mdp:compare` (each option is `# Name`, then `badge:`, `note:`,
  `cta: [text](url)`, and `- ` pros) -> `compare`.
- Fenced `mdp:flow` (steps joined by `->`) -> `flow`.
- `:::callout <note|tip|cost|recommendation|warning>` ... `:::` -> `callout`
  (`CALLOUT_VARIANTS` in `callout.mjs`; an unknown variant degrades to `note`).
- Anything else -> `paragraph`.

**Graceful degradation is a principle:** unknown directives, fences, and
containers degrade to readable text — the parser never throws and never blanks.
Preserve this when editing `parse.mjs`.

## How to extend the engine

**Add an artifact renderer:**

1. Create `packages/core/src/render-<name>.mjs` exporting
   `render<Name>(ir) -> htmlString`. Import `inline` from `inline.mjs` and the
   helpers from `shared.mjs` (`htmlDocument`, `deriveTitle`, `deriveEyebrow`,
   `splitSections`, `extractMasthead`, `sectionHeading`, `deriveTheme`,
   `deriveLangDir`).
2. Build the artifact's own **layout** CSS string and pass it to
   `htmlDocument({ title, style, body, script })`. Reuse the shared block
   classes (`.mdp-h2`, `.mdp-list`, `.mdp-figures`, `.mdp-quote`, ...). Layout
   only — never new colors or fonts.
3. Register it in `src/index.mjs`: add one entry to `RENDERERS`. `ARTIFACTS` and
   the CLI pick it up automatically.
4. Keep the render pure (see Determinism). Solve the IR; never reach back to the
   raw source or any external state.

**Add a block type:**

1. Teach `src/parse.mjs` to emit a new typed node. Unknown input must degrade to
   readable text, never throw or blank.
2. Handle the node in each `render-*.mjs`, and add shared CSS to `tokens.mjs` if
   the primitive is cross-artifact.
3. Update `spec/schema.json` and `SPEC.md` once the shape settles.

## The Claude Code plugin

This repo is also a Claude Code plugin (`.claude-plugin/`,
`commands/mdp.md`, `bin/mdp`). The `/mdp` command authors a `.mdp` file from
conversation content and runs the bundled engine to show or present it:

```bash
node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" <path-to.mdp> --open <artifact>
```

When working on the plugin, keep `commands/mdp.md`, `SPEC.md`, and the format
crib above consistent with `parse.mjs`/`tokens.mjs`.

## Conventions

- Plain Node ESM `.mjs`, no dependencies, no build tooling. Keep it that way
  unless there is a strong reason (and an ADR) to add a dependency.
- Every module starts with a comment explaining its role; match that style.
- All output is escaped via `inline.mjs` (`escapeHtml`/`inline`) — never
  hand-concatenate untrusted text into HTML.
- Apache-2.0 licensed. See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` for
  process, `CHANGELOG.md` for the release log, `SECURITY.md` for reporting.

## Git workflow for this environment

- Develop on the branch designated for the task; create it locally if needed.
- Commit with clear, descriptive messages and push with
  `git push -u origin <branch-name>`.
- Do **not** open a pull request unless the user explicitly asks for one.
