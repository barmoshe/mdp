---
name: mdp
description: Turn content into a polished page, slide deck, flyer, report, one-pager, memo, letter, scroll, accordion, tabs, or stepper and show or present it. Use when the user asks to present, show something nicely, make a deck, build slides, a one-pager, a flyer, a report, a memo, a letter, a scroll, or a brief, or to render or compile MDP (.mdp) content. MDP compiles one plain source into design-locked artifacts with no styling in the source.
---

# Show and present content with MDP

MDP compiles one plain `.mdp` source into design-locked artifacts: a `page`
(a calm scrolling document), `slides` (a full-screen deck), a `flyer` (a single
promotional poster), a `report` (a paginated long-form document: cover, auto table
of contents, numbered sections), a one-pager (`onepager`, a single dense sheet:
header band, packed two-column grid, footer, the executive leave-behind), a `memo`
(an internal business memo: a To / From / Date / Re header over a tight column),
a `letter` (formal correspondence: letterhead, date, salutation, body, sign-off),
a `scroll` (a scroll-driven narrative: each `---` section is a scene that reveals
as it scrolls into view, with a reading-progress bar and a dot rail), an
`accordion` (collapsible stacked sections built on native `<details>`: scan the
headings, open the one you need), `tabs` (a tabbed explorer: each section becomes
a panel you switch between, with arrow-key navigation and a deep-linkable URL
hash), and a `stepper` (a guided walkthrough: one numbered step at a time, with a
progress bar and Back / Next). The author writes meaning only; the engine owns all
design, so the output cannot look junky. Turn the user's content into one of those
forms and open it to show or present it.

The plugin root is this plugin's own folder: the directory that contains
`packages/`, `bin/`, `SPEC.md`, and `skills/`. Paths below are relative to it.

## Steps

1. Decide the form from the request. `present` or `slides` means the deck; `page`
   means a document; `flyer` means a promotional poster; `report` means a
   paginated long-form document with a cover, auto table of contents, and numbered
   sections; `onepager` means a single dense executive leave-behind sheet; `memo`
   means an internal To / From / Date / Re business memo; `letter` means formal
   correspondence with a letterhead, salutation, and sign-off; `scroll` means a
   scroll-driven narrative where each section reveals on scroll; `accordion` means
   collapsible stacked sections for reference or FAQ content; `tabs` means a tabbed
   explorer with arrow-key navigation and deep-linkable URL hashes; `stepper` means
   a guided walkthrough with one step at a time and Back / Next controls; `all` (or
   no clear preference) builds every form and opens the page. Then decide the
   content: a file path the user named, text they pasted, or, if neither, the most
   relevant content in the conversation or the file in focus. If the content is
   already a `.mdp` file, skip to step 3.

2. Author a `.mdp` file (a temp file is fine), following the format crib below.
   The full spec is at `<plugin-root>/SPEC.md` and a complete example is at
   `<plugin-root>/examples/block-compare.mdp`. Read them if the content needs a
   block you are unsure about. For a real document, copy the closest file in
   `<plugin-root>/templates/` and fill it in.

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
   named form (`page`, `slides`, `flyer`, `report`, `onepager`, `memo`, `letter`,
   `scroll`, `accordion`, `tabs`, or `stepper`). For `all` or no clear form, drop
   the artifact name and pass just `--open` (it opens the page). Add `--out <dir>`
   to also save the files to a folder.

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
