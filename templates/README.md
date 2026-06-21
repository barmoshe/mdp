# MDP templates

A template is a **fill-in starter**: a real document type you copy and complete.
That is different from an example (a probe you read to learn) and from the
`create-mdp-extension` scaffolder (which scaffolds engine code, not content).

Placeholders are `<ANGLE_CAPS>` slots for the values you supply and `> TODO:`
blockquote lines for guidance you fill in or delete. Placeholders are literal
text, so every template compiles as-is and stays byte-identical across runs.

[`manifest.json`](manifest.json) routes which consumers vendor or surface each one.

| template | document type | lead form | theme | when to use |
|---|---|---|---|---|
| `decision-brief.mdp` | Decision brief | page | studio | recommend one path among a few |
| `product-one-pager.mdp` | Product one-pager | flyer | teal | a single at-a-glance pitch |
| `release-notes.mdp` | Release notes | page | amber | announce a versioned release |
| `pitch-deck.mdp` | Pitch deck | slides | studio | problem, solution, traction, ask |
| `resume.mdp` | Resume / CV | page | mono | a clean, design-locked CV |
| `changelog.mdp` | Changelog | page | mono | the literal CHANGELOG entry |
| `roadmap-update.mdp` | Roadmap update | page | violet | now / next / later for stakeholders |
| `meeting-notes.mdp` | Meeting notes | page | mono | a meeting recap shared as a doc |

## How to use

```sh
cp templates/pitch-deck.mdp my-pitch.mdp
# fill every <PLACEHOLDER>, delete the > TODO: lines
node packages/core/build.mjs my-pitch.mdp --open slides
```

## Adding a template

Add `templates/<document-type>.mdp` (placeholders only, frontmatter tuned to the
type), then a `manifest.json` row, run `npm run sync:mcp`, and commit. Any
template can add `lang: he` plus `dir: rtl` for a right-to-left document.
