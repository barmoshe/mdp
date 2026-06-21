---
name: mdp
description: Turn content into a polished page, slide deck, or flyer and show or present it. Use when the user asks to present, show something nicely, make a deck or slides, a one-pager, a flyer, a brief, or to render or compile MDP.
---

# MDP: show and present content

MDP compiles one plain `.mdp` source into three design-locked artifacts: a `page`
(a calm scrolling document), `slides` (a full-screen deck), and a `flyer` (a
one-page surface). The author writes meaning only; the engine owns all design, so
the output cannot look junky. Use this skill to turn a user's content into one of
those forms and open it to show or present it.

## Workflow

1. Decide the content. Use the file or text the user pointed at, or the most
   relevant content in the conversation. If it is already a `.mdp` file, skip to
   step 3.

2. Author a `.mdp` file (a temp file is fine). MDP is valid Markdown plus a few
   typed blocks, with no styling in the source. See "Authoring" below, or the
   fuller guide at `${CLAUDE_PLUGIN_ROOT}/skills/mdp/reference.md` and the spec at
   `${CLAUDE_PLUGIN_ROOT}/SPEC.md`.

3. Pick the artifact from what the user asked for:
   - present, deck, or slides: `slides` (full-screen; arrows or space to move, F
     for fullscreen, Cmd or Ctrl + P to export a PDF).
   - page, doc, or document: `page`.
   - flyer, poster, or one-pager: `flyer`.
   - otherwise build all three and open the page.

4. Compile and open it with the bundled engine. This writes the artifacts to a
   temp folder and opens the chosen one in the default browser:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" <path-to.mdp> --open <artifact>
   ```

   Add `--out <dir>` to save the files in a folder instead of the temp preview.
   If `${CLAUDE_PLUGIN_ROOT}` is not set in your shell, run the bundled wrapper
   `"${CLAUDE_PLUGIN_ROOT}/bin/mdp" <path-to.mdp> --open <artifact>`, or locate
   `packages/core/build.mjs` inside this plugin's directory and run it with node.

5. Tell the user what you made, which file opened, and the deck controls: arrows
   or space to move, F for fullscreen, print (Cmd or Ctrl + P) for a PDF.

## Authoring (the crib)

Frontmatter:

```
---
mdp: 1
forms: [page, slides, flyer]
title: A clear title
kicker: Optional eyebrow label
lang: en
dir: ltr
---
```

Use `lang: he` (or `ar`, `fa`) with `dir: rtl` for right-to-left.

Body is valid Markdown plus typed blocks. Never put color, size, or font in the
source.

- `# Title`, then `{.lead} a one-line standfirst`.
- `## Section heading`. A line that is exactly `---` is a section or slide break.
- Lists: `- item` or `1. item`. Quote: `> text`, then `{.cite} attribution`.
- A fenced `mdp:stats` block with `Label: value` lines.
- A fenced `mdp:compare` block; each option is `# Name`, then `badge:`, `note:`,
  `cta: [text](url)`, and `- ` pros lines.
- A fenced `mdp:flow` block; steps joined by `->`.
- A `:::callout <note|tip|cost|recommendation|warning>` container, closed by `:::`.

Keep the source clean and let the engine do the design. Never hand-write HTML.
