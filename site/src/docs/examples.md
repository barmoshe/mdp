# Examples and templates

MDP ships two kinds of `.mdp` source you can learn from or build on, both in the
repository and both indexed by a manifest so nothing drifts.

## Examples

[`examples/`](https://github.com/barmoshe/mdp/tree/main/examples) holds **probes**:
small, throwaway sources that each isolate one block, theme, form, fallback, or
frontmatter slot. They are how you see a mechanic in action, and how CI proves it
keeps working. Each declares what it shows in a parser-inert `demonstrates:`
frontmatter key, and `examples/README.md` carries a generated index. Together they
cover every block, all five callout variants, all eleven themes, each form, a
right-to-left document, and the brand-logo slot.

To start from scratch, copy `examples/starter.mdp`.

## Templates

[`templates/`](https://github.com/barmoshe/mdp/tree/main/templates) holds **fill-in
starters**: a real document type you copy and complete. Placeholders are
`<ANGLE_CAPS>` slots for your values and `> TODO:` lines for guidance you fill in
or delete. The set: a decision brief, a product one-pager, release notes, a pitch
deck, a resume, a changelog, a roadmap update, and meeting notes.

```bash
cp templates/pitch-deck.mdp my-pitch.mdp
# fill every <PLACEHOLDER>, delete the > TODO: lines
node packages/core/build.mjs my-pitch.mdp --open slides
```

A template is different from an example (read to learn) and from the
`create-mdp-extension` scaffolder (which scaffolds engine code, not content).

## One source of truth

`examples/manifest.json` and `templates/manifest.json` route which consumers (CI,
the Codex plugin, the MCP server, the site playground) each file feeds, as a
closed role set. Adding a file is a manifest row plus the file: `npm run
check:examples` gates drift and coverage, and `npm run gen:docs` regenerates the
index. See `CONTRIBUTING.md` for the full convention.
