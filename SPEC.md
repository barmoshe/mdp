# MDP specification (v0.1 draft)

MDP (working name, "Markdown Presentation") is a presentation compiler for
AI-written content. One plain-text source compiles into many polished forms: a
page, a slide deck, a flyer. The design is locked in the renderer, so the output
cannot drift into the over-decorated "junky artifact" look. The source stays as
clean and diffable as ordinary Markdown. The author writes content and light
intent only. The renderer composes each form and applies the presentation
mechanics.

A markdown viewer gives you one rendering. MDP gives you a compiler.

See [VISION.md](VISION.md) for the positioning, the architecture, and the
extensibility model. This file is the syntax strawman.

## Architecture in brief

The rendering method is deterministic composition over a semantic
representation, not templates and not live AI:

1. The declarative source parses into a tree of typed meaning (a lead, a hero
   stat, a quote, a call to action), Markdoc-shaped, with no arbitrary code.
2. Each artifact (the forms below: page, slides, flyer) is a solver, not a
   template. It lays that meaning out against locked design tokens and reflows
   so it cannot look bad.
3. AI authors the source. The engine composes. The render is pure and
   reproducible: the same source produces the same output every time.

The substrate is extensible in two units, both with the design lock intact:
blocks (new typed content like a chart or timeline, rendered across every
artifact) and artifacts (new output types as new solvers over the tree).

This is a strawman. Anything marked (open) is not yet settled.

## Principles

1. The spec is a prompt. It is written so an LLM can read it and emit valid MDP
   with no examples. The examples are first-class.
2. The author cannot style. There is no color, size, or font in the source.
   Slop becomes structurally impossible, not something you prompt against.
3. Wrong input still renders. An unknown directive or a malformed block degrades
   to readable text, never a blank or black screen. A validator returns a
   precise fix so an agent can self-heal.
4. Git-native. Line-oriented and diffable. Humans and agents edit it like code.
5. Many forms, one source. The renderer compiles the same source into every
   form and decides how each block looks and behaves per form.

## The file

- Extension `.mdp`, UTF-8.
- A superset of CommonMark. Any valid MDP file is also readable as plain Markdown.
- Optional YAML frontmatter, then a Markdown body.

### Frontmatter

```
---
mdp: 1                       # format version, required
theme: studio                # a named theme, not arbitrary styling
forms: [page, slides, flyer] # which forms to compile
title: Tidewater Coffee      # optional, defaults to the first heading
kicker: Brief                # optional, the small eyebrow above the masthead
lang: he                     # optional, the document language; default "en"
dir: rtl                     # optional, writing direction; auto from lang
---
```

`forms` lists which presentation forms this source supports. `theme` selects
from a fixed set of renderer themes and never carries colors or sizes. The
author picks a designed system, not individual styles.

`kicker` sets the small eyebrow label shown above the masthead in every form.
It defaults to `Brief`. It is the one label the author may set; it carries no
styling, only the word.

`lang` and `dir` set the document language and writing direction on the root
`<html>` element. `lang` defaults to `en`. `dir` is `ltr` or `rtl`; if omitted
it is inferred from `lang` (`rtl` for `he`, `ar`, `fa`, `ur`, `yi`, matched on
the primary subtag, else `ltr`). An explicit `dir` always wins. Because the
renderer uses logical CSS properties throughout, setting `dir: rtl` flips the
whole layout (lists, the quote border, table alignment, cards) automatically;
the author never positions anything.

### Body

Standard Markdown blocks: headings, paragraphs, lists, ordered lists,
blockquotes, fenced code, images, links, tables.

A small, closed set of additions on top of plain Markdown:

1. Section breaks. A thematic break (`---` on its own line) marks a boundary. It
   is a section divider on a page, a slide break in slides, and a panel divider
   on a flyer. If no MDP renderer runs, it is just a horizontal rule.

2. Line roles. A block may open with a role tag in braces:
   - `{.lead}` a standfirst or subtitle.
   - `{.cite}` an attribution line, for example under a quote.
   - `{.note}` an aside. (open: final role set)

   A role the renderer does not know is ignored, and the text renders plainly.

3. Fenced directives. A self-terminating fenced block the renderer interprets:

````
```mdp:stats
Trial to paid: 41%
Monthly churn: 4.2%
Avg order value: $28
```
````

   An unknown kind falls back to a normal code block, so it is never lost.

   A second directive is `mdp:compare`, which lays a small set of options out as
   side-by-side cards (a pricing/options comparison). Its body is a short
   declarative block, not YAML:

````
```mdp:compare
# Make
badge: no code
note: A visual platform; the flow is boxes wired together.
cta: [See the scenario](https://example.com/make)
- See and change the flow yourself, without code.
- Runs on an external platform, a separate account.

# Apps Script
badge: inside your account
note: A small script that runs inside your Google account.
cta: [See the project](https://example.com/apps-script)
- Everything stays with you, no subscription.
- I maintain the code for you.
```
````

   Parsing is line-oriented and deterministic:
   - `# <text>` starts a new option named `<text>`.
   - `badge:`, `note:`, `cta:` set those fields on the current option.
   - `- <text>` appends a pro bullet to the current option.
   - Blank lines are ignored. The name, badge, note, cta, and each pro run
     through inline Markdown, so the `cta` link and any `**bold**` render.

   (An earlier strawman sketched `compare` as a YAML-style list; the settled v0
   syntax is the `# name` + `key: value` + `- pros` form shown here.) Every form
   renders the options as a responsive card grid: side by side where there is
   width, stacking on narrow. On the flyer the compare block is always its own
   full-width element, never paired into the two-column composition. The cards
   stay inside the house style: one ink ramp, no accent, no shadows, the cta as
   a bordered button-styled link.

   A third directive is `mdp:flow`, a short left-to-right sequence of steps (a
   pipeline read at a glance):

````
```mdp:flow
Four reports by email -> the AI writes the summary -> one Telegram message
```
````

   Steps are separated by `->`. The whole body is split on `->`, each step is
   trimmed, and empties are dropped; if the body has no `->`, each non-empty
   line is one step. Each step runs through inline Markdown. Every form renders
   the steps as bordered chips joined by an arrow connector. Under `dir: rtl`
   the row flips and the arrow is mirrored (`→` reads as `←`) so it always
   points in the reading direction. The row wraps on narrow widths.

4. Triple-colon containers. A fenced block opened with `:::<directive>` and
   closed by a line that is exactly `:::`. v1 ships one: `callout`, a bordered
   aside that lifts a short passage out of the flow.

````
:::callout cost
None of the options is entirely free.
:::
````

   The opening line is `:::callout <variant>` (a space after the colons,
   `::: callout <variant>`, is also accepted). The `<variant>` is one of `note`,
   `tip`, `cost`, `recommendation`, or `warning`; a missing or unknown variant
   falls back to `note`. The inner content is one or more blank-line-separated
   paragraphs, each rendered through inline Markdown (lists inside a callout are
   a later addition). The renderer carries emphasis without colour, at two
   levels: `recommendation` and `warning` are the key boxes (a strong
   inline-start rule and full-ink text); `note`, `tip`, and `cost` get the calm
   treatment (a hairline border and softer ink). The semantic variant stays in
   the markup as a modifier class so a future theme can style it; no label text
   is injected. A `:::` container opened with any other directive degrades
   gracefully: its inner content renders as normal blocks, nothing throws.

There is deliberately no raw HTML, no inline CSS, and no scripting in the
source. Those are the doors slop walks through.

## Forms (v1)

A form is an output shape. v1 ships three, which is enough to prove the claim
that one source yields many polished outputs.

- `page` a calm scrolling document. The reading form.
- `slides` a full-screen click-through deck. The presenting form.
- `flyer` one composed surface, a poster or one-pager. The at-a-glance form.

Later: a social card or OG image, a paginated print or PDF. (open)

## Mechanics (v1)

Mechanics are the presentation toolkit the renderer owns. The author triggers
them with content and light intent, never with styling. v1 ships four:

- Stat figures. From a `mdp:stats` block. A table on a page, a figure band in
  slides and flyer.
- Pull quote. A blockquote, optionally with `{.cite}`. An indented quote on a
  page and flyer, a full quote slide in slides.
- Columns. Adjacent short sections compose side by side where the form has
  width (page, flyer) and stack or split in slides. (explicit grouping syntax:
  open)
- Reveals. In the slides form, list and step items appear one at a time.
  Automatic, no syntax.

Later: transitions, speaker notes, an overview grid. (open)

## How a source maps to each form

The renderer, not the file, owns presentation. The same blocks compile
differently per form:

| Block | page | slides | flyer |
|---|---|---|---|
| First H1 + `{.lead}` | masthead and standfirst | title slide | flyer header |
| `##` heading | section heading in flow | slide heading | surface section |
| `---` | section divider | slide break | panel divider |
| list or ordered list | inline list | one item per reveal | compact list |
| `mdp:stats` | table | big figures | figure band |
| `mdp:compare` | card grid | own card slide | own full-width card grid |
| `mdp:flow` | chip row | chip row | own full-width chip row |
| `:::callout` | bordered aside | bordered aside | own full-width aside |
| blockquote + `{.cite}` | pull quote | full quote slide | quote block |

## House style (the part the author cannot reach)

This is the system that makes every form clean, and it is identical across
forms. The renderer guarantees:

- Type: one sans for body and UI, one serif reserved for the lead and quotes.
  Two weights only. A fixed modular scale. Strong, automatic hierarchy, so even
  a flatly written file reads with structure.
- Color: one neutral ink ramp plus a single restrained accent. Never the
  multi-color, every-block-a-card look. Color encodes meaning, not decoration.
- Space: a single spacing scale. Whitespace is the primary structural device.
- Restraint: no gradients, no drop shadows, no decorative icons. Hierarchy comes
  from type and space.
- Motion: minimal, and disabled under prefers-reduced-motion.
- Accessibility: WCAG AA contrast, semantic HTML, full keyboard navigation in
  the slides form.
- Forgiving: every failure path renders something readable. No blank slide, no
  black frame.

## Validation

A conforming tool validates the frontmatter and each directive body and returns
line-level errors with a suggested fix, so an agent can correct its own output
in one pass. (v0.1: contract defined, validator to follow in the spike.)

## Non-goals for v1

- No arbitrary HTML or JavaScript in source.
- No inline styling or per-element theming.
- No per-form authoring. The author writes once. The renderer composes all forms.
- No animation authoring. Motion belongs to the theme.

## Open questions

- The explicit grouping syntax for columns.
- The final closed set of line roles, and a `quote` or `figure` directive.
- Whether `---` always means a slide in the slides form, or whether each `##`
  also starts one.
- How images behave differently across forms.
- Additional forms (social card, print) and their mapping rules.
- The starting theme set and how a theme is defined.
- The name is settled: MDP, for Markdown Presentation, owning the acronym.
