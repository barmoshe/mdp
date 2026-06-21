# MDP authoring reference

The full format lives in `${CLAUDE_PLUGIN_ROOT}/SPEC.md`. This is the working
crib plus a complete example to copy from. The rule that matters: the source
carries meaning, never styling. No color, size, font, or HTML in a `.mdp` file.

## Frontmatter

```
---
mdp: 1                          # required, the format version
forms: [page, slides, flyer]    # optional, defaults to all three
title: A clear title            # optional, defaults to the first heading
kicker: Decision brief          # optional, the small eyebrow label
lang: en                        # optional, language code
dir: ltr                        # optional, ltr or rtl; he/ar/fa default to rtl
---
```

## Blocks

| You write | What it becomes |
|---|---|
| `# Title` | the document title and the title slide |
| `{.lead} text` | a standfirst under the title |
| `## Heading` | a section heading (a slide in the deck) |
| `---` on its own line | a section divider, a slide break, a panel break |
| `- item` or `1. item` | a list |
| `> quote` then `{.cite} name` | a pull quote with attribution |
| a fenced `mdp:stats` block | a row of big figures, or a table on the page |
| a fenced `mdp:compare` block | options as side-by-side cards |
| a fenced `mdp:flow` block | a step pipeline with arrows |
| `:::callout <variant>` ... `:::` | a boxed aside (note, tip, cost, recommendation, warning) |

Inline Markdown works in all text: `**bold**`, `*italic*`, `[link](url)`,
`` `code` ``.

## A complete example

````
---
mdp: 1
forms: [page, slides, flyer]
kicker: Decision brief
title: Two ways to run the nightly digest
---

# Two ways to run the nightly digest
{.lead} Both paths reach the same result. They differ in where the work runs.

```mdp:flow
Collect the data -> The model writes the summary -> Send one message
```

---

```mdp:compare
# Managed platform
badge: no code
note: A visual builder, the pipeline is boxes wired together.
cta: [See the scenario](https://example.com/managed)
- See and edit the pipeline yourself, no code.
- Runs on a third-party platform and account.

# Self-hosted script
badge: in your stack
note: A small script that runs inside your own environment.
cta: [See the project](https://example.com/self-hosted)
- Everything stays in your account, no extra subscription.
- A maintainer keeps the code current for you.
```

---

:::callout recommendation
Start self-hosted, since everything stays in your account with no platform cost.
Move to the managed platform later if you would rather edit the pipeline yourself.
:::
````

## Compile and show or present

```bash
# show a document or a one-pager
node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" my.mdp --open page
node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" my.mdp --open flyer

# present the deck (arrows or space to move, F for fullscreen, print for a PDF)
node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" my.mdp --open slides

# build all three to a folder without opening
node "${CLAUDE_PLUGIN_ROOT}/packages/core/build.mjs" my.mdp --out ./out
```
