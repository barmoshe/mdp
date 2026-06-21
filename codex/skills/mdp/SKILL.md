---
name: mdp
description: Turn content into a polished page, slide deck, or flyer and show or present it. Use when the user asks to present, show something nicely, make a deck, build slides, a one-pager, a flyer, or a brief, or to render or compile MDP (.mdp) content. MDP compiles one plain source into three design-locked artifacts with no styling in the source.
---

# Show and present content with MDP

MDP compiles one plain `.mdp` source into three design-locked artifacts: a `page`
(a calm scrolling document), `slides` (a full-screen deck), and a `flyer` (a
one-page surface). The author writes meaning only; the engine owns all design, so
the output cannot look junky. Turn the user's content into one of those forms and
open it to show or present it.

The plugin root is this plugin's own folder: the directory that contains
`packages/`, `bin/`, `SPEC.md`, and `skills/`. Paths below are relative to it.

## Steps

1. Decide the form from the request. `present` or `slides` means the deck; `page`
   means a document; `flyer` means a one-pager; `all` (or no clear preference)
   builds every form and opens the page. Then decide the content: a file path the
   user named, text they pasted, or, if neither, the most relevant content in the
   conversation or the file in focus. If the content is already a `.mdp` file,
   skip to step 3.

2. Author a `.mdp` file (a temp file is fine), following the format crib below.
   The full spec is at `<plugin-root>/SPEC.md` and a complete example is at
   `<plugin-root>/examples/comparison.mdp`. Read them if the content needs a block
   you are unsure about.

3. Compile and open it with the bundled engine. The wrapper self-locates the
   engine, writes the artifacts to a temp folder, and opens the chosen one in the
   default browser:

   ```bash
   "<plugin-root>/bin/mdp" <path-to.mdp> --open <artifact>
   ```

   If running the wrapper is awkward, call the engine directly instead:

   ```bash
   node "<plugin-root>/packages/core/build.mjs" <path-to.mdp> --open <artifact>
   ```

   Map the form to `<artifact>`: `present` becomes `slides`; otherwise use the
   named form (`page`, `slides`, or `flyer`). For `all` or no clear form, drop the
   artifact name and pass just `--open` (it opens the page). Add `--out <dir>` to
   also save the files to a folder.

4. Tell the user what you made, which file opened, and the deck controls: arrows
   or space to move, `F` for fullscreen, print (Cmd or Ctrl + P) for a PDF.

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
