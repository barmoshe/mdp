---
description: Turn content into a polished page, slide deck, flyer, report, one-pager, memo, letter, scroll, accordion, tabs, stepper, or plan and show or present it. Use when the user asks to present, show something nicely, make a deck, slides, a one-pager, a flyer, a report, a memo, a letter, a scroll, a plan, a brief, or to render or compile MDP.
argument-hint: [present|page|slides|flyer|report|onepager|memo|letter|scroll|accordion|tabs|stepper|plan|all] [content, a file path, or nothing for the current content]
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
hash), a `stepper` (a guided walkthrough: one numbered step at a time, with a
progress bar and Back / Next), and a `plan` (an implementation plan: each `---`
section is a collapsible phase, and `mdp:tasks` checklists drive a live progress
meter). The author writes meaning only; the engine owns all
design, so the output cannot look junky. Turn the user's content into one of those
forms and open it to show or present it.

Arguments: $ARGUMENTS

## Steps

1. Decide the content. The first word of the arguments may be a mode: `present`
   or `slides` (the deck), `page` (a document), `flyer` (a promotional poster),
   `report` (a paginated long-form document with a cover, auto table of contents,
   and numbered sections), `onepager` (a single dense executive leave-behind
   sheet), `memo` (an internal To / From / Date / Re business memo), `letter`
   (formal correspondence with a letterhead, salutation, and sign-off), `scroll`
   (a scroll-driven narrative with scene reveals and a progress bar), `accordion`
   (collapsible stacked sections for reference or FAQ content), `tabs` (a tabbed
   explorer with arrow-key navigation and deep-linkable URL hashes), `stepper`
   (a guided walkthrough with one step at a time and Back / Next controls), `plan`
   (an implementation plan: collapsible phases and tick-off task checklists), or
   `all`.
   The rest is the content: a file path, pasted text, or empty (then use the most
   relevant content in the conversation or the file in focus). If the content is
   already a `.mdp` file, skip to step 3.

2. Author a `.mdp` file (a temp file is fine), following the format below. The
   full spec is at `${CLAUDE_PLUGIN_ROOT}/SPEC.md`, and a complete example is at
   `${CLAUDE_PLUGIN_ROOT}/examples/block-compare.mdp`. For a real document, copy
   the closest file in `${CLAUDE_PLUGIN_ROOT}/templates/` and fill it in.

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
