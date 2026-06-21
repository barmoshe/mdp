---
description: Turn content into a polished MDP page, slide deck, or flyer, then show or present it.
argument-hint: [present|page|slides|flyer|all] [content, a file path, or nothing for the current content]
---

Turn content into polished MDP artifacts and show or present them.

Arguments: $ARGUMENTS

1. The first word may be a mode: `present` or `slides` (the deck), `page` (a
   document), `flyer` (a one-pager), or `all`. The rest is the content: a file
   path, pasted text, or nothing (use the most relevant content in the
   conversation or the file in focus).

2. If the content is not already a `.mdp` file, author one. MDP is valid Markdown
   plus a few typed blocks, with no styling in the source: frontmatter (`mdp: 1`,
   `forms`, `title`, optional `kicker`/`lang`/`dir`); then `# Title`,
   `{.lead} standfirst`, `## sections`, `---` breaks, `- ` and `1. ` lists,
   `> quotes` with `{.cite}`, and the fenced `mdp:stats`, `mdp:compare`,
   `mdp:flow`, and `:::callout <variant>` blocks. The full guide is in the `mdp`
   skill (`${CLAUDE_PLUGIN_ROOT}/skills/mdp/reference.md`). Write it to a temp file.

3. Compile and open it with the bundled engine:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" <path-to.mdp> --open <artifact>
   ```

   Map the mode to `<artifact>`: present -> slides, otherwise the named form. For
   `all` or no mode, build everything and open the page. If `${CLAUDE_PLUGIN_ROOT}`
   is not set in your shell, use the bundled wrapper
   `"${CLAUDE_PLUGIN_ROOT}/bin/mdp"` instead.

4. Tell the user what you made, which file opened, and the deck controls: arrows
   or space to move, F for fullscreen, print (Cmd or Ctrl + P) for a PDF.
