---
description: Turn content into a polished page, slide deck, or flyer and show or present it. Use when the user asks to present, show something nicely, make a deck, slides, a one-pager, a flyer, a brief, or to render or compile MDP.
argument-hint: [present|page|slides|flyer|all] [content, a file path, or nothing for the current content]
---

# Show and present content with MDP

MDP compiles one plain `.mdp` source into three design-locked artifacts: a `page`
(a calm scrolling document), `slides` (a full-screen deck), and a `flyer` (a
one-page surface). The author writes meaning only; the engine owns all design, so
the output cannot look junky. Turn the user's content into one of those forms and
open it to show or present it.

Arguments: $ARGUMENTS

## Steps

1. Decide the content. The first word of the arguments may be a mode: `present`
   or `slides` (the deck), `page` (a document), `flyer` (a one-pager), or `all`.
   The rest is the content: a file path, pasted text, or empty (then use the most
   relevant content in the conversation or the file in focus). If the content is
   already a `.mdp` file, skip to step 3.

2. Author a `.mdp` file (a temp file is fine), following the format below. The
   full spec is at `${CLAUDE_PLUGIN_ROOT}/SPEC.md`, and a complete example is at
   `${CLAUDE_PLUGIN_ROOT}/examples/comparison.mdp`.

3. Compile and open it with the bundled engine. This writes the artifacts to a
   temp folder and opens the chosen one in the default browser:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" <path-to.mdp> --open <artifact>
   ```

   Map the mode to `<artifact>`: present becomes slides, otherwise use the named
   form. For `all` or no mode, drop the artifact name and just pass `--open`
   (it opens the page). Add `--out <dir>` to also save the files. If
   `${CLAUDE_PLUGIN_ROOT}` is empty in your shell, run the bundled wrapper
   `"${CLAUDE_PLUGIN_ROOT}/bin/mdp"` with the same arguments instead.

4. Tell the user what you made, which file opened, and the deck controls: arrows
   or space to move, F for fullscreen, print (Cmd or Ctrl + P) for a PDF.

## The MDP format (crib)

No styling ever goes in the source; the engine owns the design.

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

`theme` picks a color theme (the author never sets raw colors): `studio` (the
default, indigo), `ocean`, `teal`, `forest`, `amber`, `terracotta`, `coral`,
`rose`, `plum`, `violet`, or `mono` (black and white).
Pick one that fits the content's tone. Use `lang: he` (or `ar`, `fa`) with
`dir: rtl` for right-to-left.

Body is valid Markdown plus typed blocks:
- `# Title`, then `{.lead} a one-line standfirst`.
- `## Section heading`. A line that is exactly `---` is a section or slide break.
- Lists: `- item` or `1. item`. Quote: `> text`, then `{.cite} attribution`.
- A fenced `mdp:stats` block with `Label: value` lines.
- A fenced `mdp:compare` block; each option is `# Name`, then `badge:`, `note:`,
  `cta: [text](url)`, and `- ` pros lines.
- A fenced `mdp:flow` block; steps joined by `->`.
- A `:::callout <note|tip|cost|recommendation|warning>` container, closed by `:::`.

Keep the source clean and never hand-write HTML.
