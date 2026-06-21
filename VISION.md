# MDP vision

## In one line

MDP is a presentation compiler for AI-written content. One declarative source is
composed, deterministically, into many polished artifacts: a page, a deck, a
flyer, and whatever the ecosystem builds next. The design is locked in the
engine, so the output cannot look junky.

## The name

MDP, for Markdown Presentation. We are owning the acronym. It also means Markov
Decision Process to a machine-learning audience, but the full name
disambiguates, the `.mdp` extension carries it, and a clear, literal name beats
a clever one. Decided, not deferred.

## The problem

AI writes oceans of Markdown. It is clean and cheap but reads as a flat wall of
text. So when someone says "show it to me nicely," the agent makes a one-off
HTML artifact that looks fine once and is junky and unmaintainable the next day.
The build itself is already a one-click, polished, live link. Everything you say
about the build, the deck, the one-pager, the landing copy, is still
hand-assembled and looks thrown together. That gap is MDP's shape.

## Who it is for

Everyone who builds with AI, especially the vibe-building crowd, where about 63
percent are not developers. They live in Lovable, Cursor, v0, bolt, and Claude.
MDP is invisible to them: the agent emits it, the human just gets polished
output, and there is zero syntax to learn. The format is for the machine, the
polish is for the person.

## Why we are not a markdown viewer

Rendering markdown nicely is a commodity: remark, Tailwind Typography, Marp, and
a dozen others do it. Pretty-deck generation is also a commodity that nobody
pays for: Tome had 20 million users and still killed its slides product. MDP is
a compiler and a substrate, not a viewer. A viewer gives you one rendering. MDP
compiles one source into many artifacts and stays open for others to build more.

## The rendering method (the new part)

This is the core, and it is a fusion nobody has shipped:

1. Declarative source. Markdoc-shaped: typed tags filled with data, no arbitrary
   code. This is what keeps it agent-emittable, statically checkable, and safe.
2. A semantic representation. The source parses into typed meaning, a lead, a
   hero stat, a quote, a call to action, a section, a list. Intent, not layout.
3. Deterministic composition. Each artifact is a solver, not a template. It lays
   the meaning out against locked design tokens and reflows so it cannot look
   bad, but it is compiled once and reproducible.
4. AI authors, the engine composes. The AI works at authoring time, writing the
   source. The render path is pure: the same source produces the same output
   every time.

Pandoc proved one source to many outputs. Gamma proved a reflow engine that
cannot look bad. Markdoc proved a safe declarative tree with no code. Each
proved one leg. Nobody has built all three into a publishable substrate. That
fusion is the defensible new method.

## Extensibility (the substrate)

MDP is open, with a two-tier design lock:

- Content authors write meaning only. They cannot style, so slop is impossible
  by construction.
- Extension authors build the design. They publish new blocks and new artifacts,
  curated, where the design actually lives.

Two extension units, both open:

- Blocks: new typed content, a chart, a timeline, a gallery, that every artifact
  can render. Schema-validated and agent-emittable.
- Artifacts: new output types, a resume, a changelog, a portfolio, as new
  solvers over the same semantic representation.

The ecosystem flywheel is boring and reliable: a registry plus a naming
convention, the way Slidev uses slidev-theme names, so publishing an extension
is one step.

## How it reaches people

Not an app to visit, not a syntax to learn. MDP is a capability the agent
already reaches for inside the tool the builder is in: an MCP server or an agent
skill, which is cross-host, since Claude, Cursor, and others all speak MCP. The
human says "make a deck for this," the agent emits MDP, the engine composes. It
is the same one click as "deploy to a live link," but for talking about what you
built.

## v1 scope

- Reference artifacts: page, slides, flyer.
- Blocks shipped: stat figures, pull quote, compare, callout, and flow, with
  right-to-left support.
- A curated set of locked themes. The author writes meaning only and picks a
  named vibe; the engine owns all design.
- The proof: one source composes deterministically into the three artifacts and
  looks shipped, demonstrated on a real bilingual comparison document.

## Differentiation, in one breath

Markdown viewers give you one rendering. Slide tools make you hand-build each
deck. Gamma is proprietary and lossy. MDP is the open, declarative,
agent-emittable substrate that composes one source into many design-locked
artifacts, deterministically. The moat is the contract and the engine. The
rendering itself we borrow.

## Open questions

- The exact declarative grammar for blocks, which will move before 1.0.
- The first extension units to open publicly, blocks before artifacts, and the
  registry and naming convention that seed them.
- The hosted surfaces: a live playground and an MCP server.
