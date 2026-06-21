# MDP

Markdown Presentation. A presentation compiler for AI-written content. One
declarative `.mdp` source composes, deterministically, into many polished,
design-locked artifacts: a page, a slide deck, and a flyer.

A markdown viewer gives you one rendering. MDP gives you a compiler.

![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)
![Dependencies: zero](https://img.shields.io/badge/dependencies-zero-brightgreen)

## Why

AI writes oceans of Markdown. It is clean and cheap but reads as a flat wall of
text. Ask to "show it nicely" and you get a one-off HTML artifact that looks
fine once and is junky and unmaintainable the next day. MDP closes that gap. The
author, a person or an agent, writes meaning. The engine owns all design, so the
output cannot look junky. And the same source becomes a page, a deck, and a
flyer.

## Quick start

No dependencies. Plain Node ESM, Node 18 or newer.

```
git clone https://github.com/barmoshe/mdp
cd mdp
node packages/core/build.mjs examples/comparison.mdp
```

This writes `dist/page.html`, `dist/slides.html`, and `dist/flyer.html`. Open
them in a browser. The render path is pure, so two runs produce byte-identical
output.

Try `examples/tidewater.mdp` for a simple brief, or `examples/comparison.mdp`
for the full block set, including a right-to-left example.

To show or present an artifact, add `--open`:

```
node packages/core/build.mjs examples/comparison.mdp --open slides
```

This opens the deck in your browser. In the deck, arrows or space move, F toggles
fullscreen, and print (Cmd or Ctrl + P) exports a PDF. Use `--open page` or
`--open flyer` to show those forms.

## Use it in Claude Code

MDP ships a Claude Code plugin, so you can go from content to a polished artifact
without leaving your editor. This repo is the marketplace.

```
/plugin marketplace add barmoshe/mdp
/plugin install mdp@mdp
```

Then just ask, for example "show this as a deck", "make a one-pager from this
file", or "present this", or run the command:

```
/mdp present <a file, some text, or nothing>
```

Claude authors clean MDP, compiles it with the bundled engine, and opens the
page, slide deck, or flyer to show or present it.

## What a source looks like

````
---
mdp: 1
forms: [page, slides, flyer]
title: Two ways to run the digest
---

# Two ways to run the digest
{.lead} Both paths reach the same result. They differ in where the work runs.

```mdp:flow
Collect data -> The model writes the summary -> Send one message
```

```mdp:compare
# Managed platform
badge: no code
- See and edit the pipeline yourself.

# Self-hosted script
badge: in your stack
- Everything stays in your account.
```

:::callout recommendation
Start self-hosted, then move later if you prefer a visual builder.
:::
````

It is valid, readable Markdown. There is no color, size, or font anywhere in the
source. The design lives in the engine.

## Blocks

- `{.lead}` a standfirst, `{.cite}` an attribution under a quote.
- `mdp:stats` key and value figures.
- `mdp:compare` options side by side, each with a badge, a note, pros, and a CTA.
- `mdp:flow` an `a -> b -> c` pipeline.
- `:::callout <variant>` a note, tip, cost, recommendation, or warning.
- `---` a section break: a divider on a page, a slide break in slides.
- Right-to-left: set `lang` and `dir` in the frontmatter.

See [SPEC.md](SPEC.md) for the full format and [VISION.md](VISION.md) for the
architecture and the extensibility model.

## How it works

One declarative source parses into a tree of typed meaning. Each artifact is a
solver, not a fixed template: it lays that meaning out against locked design
tokens, so the output is composed once and is reproducible. AI authors the
source, the engine composes. No styling ever lives in the document.

## Status

Early and honest. A working engine that proves the core claim: one source
composes deterministically into three clean artifacts, with a first set of
blocks and right-to-left support. The format and the block grammar will move
before 1.0. Issues and ideas are welcome.

## Roadmap

A live playground (source on the left, the artifacts on the right), an
`mdp:chart` block, a `create-mdp-extension` scaffolder, and an MCP server so an
agent can emit MDP from inside the tools you already use.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md), the
machine-facing build guide.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
