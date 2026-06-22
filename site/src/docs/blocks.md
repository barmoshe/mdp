# Blocks

Beyond plain Markdown, MDP adds a typed set of elements, organized in a few
categories today, with more on the way. Each one is content and light intent,
never styling. Every element renders across every form, and the renderer
decides how it looks in each.

The categories are **Text & quotes**, **Data & diagrams**, and **Callouts
& layout**.

## Text & quotes

### Lead and cite

Line roles: open a line with a role tag in braces. `{.lead}` is a standfirst or
subtitle; `{.cite}` is an attribution line. A role the renderer does not know is
ignored, and the text renders plainly.

```text
{.lead} Both paths reach the same result. They differ in where the work runs.
```

### Pull quote

A blockquote, optionally with a `{.cite}` attribution line. An indented serif
quote on a page and flyer, a full quote slide in slides.

```text
> "I finally know the name of the farm in my cup."
> {.cite} Pilot subscriber, week 3
```

## Data & diagrams

### Stats

A key-and-value figure set. A fenced `mdp:stats` block, one `Label: value` per
line.

````text
```mdp:stats
Trial to paid: 41%
Monthly churn: 4.2%
Avg order value: $28
```
````

A table on a page, a band of big figures in slides and on the flyer.

### Compare

Options laid out side by side, for a pricing or options comparison. The body is a
short, line-oriented declarative block, not YAML.

````text
```mdp:compare
# Managed platform
badge: no code
note: A visual builder. The pipeline is boxes wired together.
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
````

Parsing is deterministic and line-oriented:

- `# <text>` starts a new option named `<text>`.
- `badge:`, `note:`, and `cta:` set those fields on the current option.
- `- <text>` appends a pro bullet to the current option.
- Blank lines are ignored. Names, badges, notes, the cta, and each pro run
  through inline Markdown, so a `cta` link and any `**bold**` render.

Every form renders the options as a responsive card grid: side by side where
there is width, stacking on narrow. On the flyer the compare block is always its
own full-width element. The cta is a bordered, button-styled link.

### Flow

A short left-to-right pipeline, read at a glance. Steps are separated by `->`.

````text
```mdp:flow
Collect the day's data -> The model writes the summary -> Send one message
```
````

The body is split on `->`, each step is trimmed, and empties are dropped. If the
body has no `->`, each non-empty line is one step. Every form renders the steps
as bordered chips joined by an arrow connector. Under `dir: rtl` the row flips
and the arrow mirrors, so it always points in the reading direction. The row
wraps on narrow widths.

## Callouts & layout

### Callout

A bordered aside that lifts a short passage out of the flow. A triple-colon
container opened with `:::callout <variant>` and closed by a line that is exactly
`:::`.

```text
:::callout recommendation
Start self-hosted, since everything stays in your account with no platform cost.
Move to a managed platform later if you prefer a visual builder.
:::
```

The `<variant>` is one of `note`, `tip`, `cost`, `recommendation`, or `warning`;
a missing or unknown variant falls back to `note`. The renderer carries emphasis
without color, at two levels: `recommendation` and `warning` are the key boxes (a
strong inline-start rule and full-ink text); `note`, `tip`, and `cost` get the
calm treatment (a hairline border and softer ink). No label text is injected; the
semantic variant stays in the markup so a future theme can style it.

### Section breaks

A thematic break, `---` on its own line, marks a boundary: a section divider on a
page, a slide break in slides, and a panel divider on a flyer. If no MDP renderer
runs, it is just an ordinary horizontal rule.

### Right-to-left

Set `lang` and `dir: rtl` in the frontmatter and the whole layout flips: lists,
the quote border, table alignment, cards, and the flow arrow. The author
positions nothing. See [the format](#/docs/format) for the inference rules.

## More on the way

The element set grows by category. A chart block is next, and new categories can
be added without ever unlocking the design: the author still writes meaning, and
the engine still owns every pixel.
