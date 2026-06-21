# Getting started

MDP is a presentation compiler for AI-written content. One declarative `.mdp`
source compiles, deterministically, into many polished, design-locked artifacts:
a page, a slide deck, and a flyer. The author writes meaning; the engine owns all
design, so the output cannot drift into the over-decorated "junky artifact" look.

A markdown viewer gives you one rendering. MDP gives you a compiler.

## Install

There is nothing to install. The engine is plain Node ESM with zero
dependencies, and it runs on Node 18 or newer.

```bash
git clone https://github.com/barmoshe/mdp
cd mdp
node packages/core/build.mjs examples/block-compare.mdp
```

That writes `dist/page.html`, `dist/slides.html`, and `dist/flyer.html`. Open
them in a browser. The render path is pure, so two builds of the same source are
byte-identical.

## Your first source

Create a file `hello.mdp`:

```text
---
mdp: 1
theme: studio
forms: [page, slides, flyer]
title: Hello, MDP
---

# Hello, MDP
{.lead} One source, three polished artifacts. You wrote meaning; the engine did the design.

## Why it is calm
- No color, size, or font lives in this file.
- The engine owns the look, so it cannot go junky.
- The same source becomes a page, a deck, and a flyer.
```

Compile and open it:

```bash
node packages/core/build.mjs hello.mdp --open page
```

`--open` shows the result in your browser. Use `--open slides` to present the
deck, or `--open flyer` for the one-pager.

## What to read next

- The [format](#/docs/format) covers the frontmatter and the body.
- [Blocks](#/docs/blocks) is the full grammar: stats, compare, flow, callout.
- [Forms](#/docs/forms) explains how one source maps to a page, slides, and a flyer.
- [Examples & templates](#/docs/examples): browse the example probes, or copy a
  fill-in template (or `examples/starter.mdp`) to start a real document.
- Or skip the install and try the [live playground](#playground): edit a source
  and watch the real engine compile it.
