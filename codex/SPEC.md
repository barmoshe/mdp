# MDP specification

MDP ("Markdown Presentation") is a presentation compiler for
AI-written content. One plain-text source compiles into many polished forms: a
page, a slide deck, a flyer, a report, a one-pager, a memo, a letter, and
interactive forms: a scroll story, an accordion, tabs, a stepper, a plan. The design
is locked in the renderer, so the output
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
2. Each artifact (the forms below: page, slides, flyer, report, onepager, memo,
   letter, scroll, accordion, tabs, stepper, plan) is a solver, not a template. It lays that meaning out against locked
   design tokens and reflows so it cannot look bad.
3. AI authors the source. The engine composes. The render is pure and
   reproducible: the same source produces the same output every time.

The substrate is extensible in two units, both with the design lock intact:
blocks (new typed content like a chart or timeline, rendered across every
artifact) and artifacts (new output types as new solvers over the tree).

This is a strawman. Anything marked (open) is not yet settled.

## Principles

1. The spec is a prompt. It is written so an LLM can read it and emit valid MDP
   with no examples. The examples are first-class.
2. The author cannot style. There is no styling and no sizing in the source; the
   only color an author may name is a brand color the engine fully derives, and
   the only font choice is one of a closed set of system families. Slop becomes
   structurally impossible, not something you prompt against. (Three deliberate,
   narrow amendments: `brand-logo` names a single brand asset; `brand-accent`
   (with an optional `brand-accent-2`) names one or two brand colors, which the
   engine derives into all five accent roles in light and dark, gates to WCAG AA,
   places, and falls back to a named `theme` when inaccessible; and `brand-font`
   picks the body family from a fixed set of system stacks, no web fonts. The
   author picks a mark, a color, and a font character, never how, where, or what
   size they render. See Frontmatter.)
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
theme: studio                # a named theme: studio ocean teal forest amber terracotta coral rose plum violet mono
forms: [page, slides, flyer] # which forms to compile
title: Tidewater Coffee      # optional, defaults to the first heading
kicker: Brief                # optional, the small eyebrow above the masthead
lang: he                     # optional, the document language; default "en"
dir: rtl                     # optional, writing direction; auto from lang
brand-logo: ./logo.svg       # optional, a brand mark placed in the masthead
brand-accent: #2f8f6b        # optional, one brand color (hex, rgb()/hsl(), or a CSS name); the engine derives the accent set
brand-accent-2: #e8a33d      # optional, a secondary brand color for a few accents
brand-font: rounded          # optional, body font: system serif mono rounded humanist
to: Engineering              # optional, read by memo and letter (recipient)
from: Bar Moshe              # optional, read by memo and letter (sender)
date: 2026-06-22             # optional, read by memo and letter
salutation: Dear team,       # optional, read by letter
signoff: Best regards,       # optional, read by letter
---
```

`forms` lists which presentation forms this source supports. `theme` selects
from a fixed set of renderer themes and never carries colors or sizes. The
author picks a designed system, not individual styles.

The themes share one warm neutral ramp and differ only in a single restrained
accent, used in meaning-spots (links, the compare button, the recommendation
callout, stat figures, the active slide dot, flow arrows), never to color a whole
surface. The set, ordered as a spectrum: `studio` (the default, an
indigo accent), `ocean` (a true blue), `teal` (a blue-green), `forest` (a natural
green), `amber` (a warm gold), `terracotta` (an earthy burnt clay), `coral` (a
warm coral red), `rose` (a muted pink-red), `plum` (a deep berry), `violet` (a
soft purple), and `mono` (a strict black-and-white, no accent). Every theme
is tuned to pass WCAG AA in light and dark. An unknown theme name falls back to
`studio`.

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

`brand-logo` is an optional brand mark the engine places in the masthead. Its
value is an asset reference only: a URL, a relative path, or a base64
`data:image/...` URI. The engine emits it as an `<img>` at a locked size and
position per form (the inline-start of the masthead, flipped under `dir: rtl`);
the author chooses which mark, never how it looks. The value passes a scheme
allowlist (`http(s)`, `/`, `./`, `../`, and base64 `data:image/*` only) and is
emitted in image mode (never inline `<svg>`), so it cannot smuggle script; an
unsafe or malformed value is dropped and the masthead renders without a logo. It
is the one amendment to Principle 2: an asset slot is not a color, size, or font.
Prefer SVG or a 2x raster; an agent should normally omit it or use a known URL,
not synthesize a large `data:` URI.

`brand-accent` is an optional custom brand color: a hex (`#RGB`, `#RGBA`,
`#RRGGBB`, or `#RRGGBBAA`), an `rgb()`/`rgba()`/`hsl()`/`hsla()` value, or a CSS
color name like `navy`. It must be unquoted (the frontmatter scanner keeps quote
characters, so a quoted value fails to parse). The engine normalizes it to one
opaque hex, then derives a full accent set from it, the five roles (the fill, the
on-fill label, the link/label text, a surface wash, and a border) in both light
and dark, and gates the load-bearing roles to WCAG AA exactly as the named themes
are. It overrides only the accent; the warm neutral ramp and the type scale are
untouched. An unrecognized value, or a color that cannot be made accessible, is
ignored and the document falls back to `theme`, then `studio`. `brand-accent-2`
names an optional second brand color used
sparingly in engine-chosen spots only (the title underline, the flow connectors,
and the active slide dot); it applies only alongside `brand-accent` and falls back
to it. Like the logo, this amends Principle 2: the author names a color, never a
style, and never where it lands.

`brand-font` selects the body and UI font from a closed set of system font stacks:
`system` (the default), `serif`, `mono`, `rounded`, and `humanist`. The serif role
used for the lead and quotes is unchanged, so the two-family character is kept.
These are system families only, no `@font-face` and no network, so determinism and
the offline posture hold; an unknown value falls back to the theme default. This is
the third amendment to Principle 2: the author picks a font character from a fixed
set, never an arbitrary font or a size.

Inline color swatches are the body-level complement to `brand-accent`. When an
inline code span is exactly one recognized color literal (a hex, an `rgb()`/`hsl()`,
or a CSS color name, the same set `brand-accent` accepts), the engine prepends a
small color chip inside the `<code>` so a palette reads as color, not just text. The
chip color is the normalized 6-digit hex, so `#000080`, `navy`, and `rgb(0, 0, 128)`
render an identical swatch, and no author text ever reaches CSS. An ordinary code
span, or one holding a malformed color, is left untouched. This is not author
styling (the non-goal below still holds): the author names a color, the engine owns
the mark, exactly as with `brand-accent`.

`to`, `from`, `date`, `salutation`, and `signoff` are optional plain-string
fields read only by the document forms that need them: `memo` and `letter` use
`to`, `from`, and `date` for their headers; `letter` additionally uses
`salutation` and `signoff` for the opening line and the sign-off. They carry no
styling, only text, and every other form ignores them.

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

   A fourth directive is `mdp:table`, a data table in GitHub-flavored pipe
   syntax. It can also be written as a bare pipe table in the body, with no
   fence:

````
| Plan | Price | Seats |
| --- | ---: | :--: |
| Starter | $0 | 1 |
| Team | $40 | 10 |
````

   The delimiter row sets each column's alignment from its colons: `:---` is
   start, `---:` is end, `:--:` is center. Alignment is stored as a logical
   keyword, so an end-aligned column flips under `dir: rtl`. Rows are padded or
   truncated to the header width, and every cell runs through inline Markdown. A
   header row whose next line is not a delimiter is not a table; it degrades to a
   paragraph.

   A fifth directive is `mdp:chart`, a horizontal bar chart from `label: value`
   pairs (the same input as `mdp:stats`, but the value is a number):

````
```mdp:chart
Visitors: 1000
Signups: 420
Paid: 120
```
````

   Each bar's length is its value as a share of the largest, computed by the
   engine (the author never sets a width). The bar carries the theme accent and
   grows from the inline-start edge, so it flips under `dir: rtl`. A non-numeric
   value is dropped; labels and values always read as text, so the data survives
   even where a bar cannot.

   A sixth directive is `mdp:diagram`, a connector diagram the engine renders to
   pure inline SVG (no dependency, no script). The fence names a kind:

````
```mdp:diagram flow
A: Brief
B: Draft
A -> B
B -> A: changes
```
````

   `A: label` declares or labels a node; `A -> B` is an edge, `A --> B` a dashed
   one, and a trailing `: text` labels the edge. In a `tree`, that trailing text
   instead names the child node (a hierarchy has named nodes, not labeled
   connectors), so `parent -> child: Name` renders `Name` in the child's box; an
   explicit `child: Name` declaration still wins. Three kinds ship: `flow` (a
   layered top-to-bottom flowchart), `sequence` (actors as lifelines with ordered
   messages, with an `actor A: Alice` alias accepted), and `tree` (a tidy
   hierarchy). The layout is deterministic (integer coordinates, no randomness)
   and design-locked (geometry only; every colour is a theme token). Diagrams
   render left to right in every form for now; an unknown kind degrades to
   readable text. More kinds (gantt, state, ER) are planned behind the same
   syntax.

   A seventh directive is `mdp:timeline`, a vertical sequence of steps (distinct
   from the horizontal `mdp:flow` chips). A `# Title` starts a step; the lines
   under it are its body:

````
```mdp:timeline
# Brief
We scope the work from a short brief.

# Ship
One file, deployed and measured.
```
````

   Steps render on a single accent rail with a dot each. A step with no body
   shows just its title. Every form reads it the same way.

   An eighth directive is `mdp:faq`, question and answer pairs:

````
```mdp:faq
Q: Does it need a build step?
A: No, it runs directly.
```
````

   Each pair renders as a native `<details>` / `<summary>` disclosure: open by
   default so the answers show on the static and print forms, and collapsible
   with the keyboard on page and slides. No script.

   A ninth directive is `mdp:pricing`, a set of priced tiers:

````
```mdp:pricing
# Team
badge: Popular
price: $40
period: /mo
- 10 projects
- Email support
cta: [Choose Team](#)
```
````

   A `# Name` starts a tier; `badge:`, `price:`, `period:`, and `cta:` set its
   fields, and `- feature` appends to the checklist. It is the priced sibling of
   `mdp:compare`: the same locked card grid, standardised around a price and a
   single call to action. The `cta:` takes a `[text](url)` link.

   A tenth directive is `mdp:tasks`, a status-aware checklist:

````
```mdp:tasks
- [x] A task already done
- [~] The task in progress now
- [ ] A task still to do
- A bare bullet is a to-do
```
````

   Each non-blank line is one task. An optional marker sets its status: `[x]`
   (or `[X]`) is done, `[~]` is in progress, `[ ]` (or a bare `-`/`*` bullet) is
   to-do; a line that does not match still becomes a to-do (it never throws or
   drops). Status reads through the design lock with no new colour: a done item
   fills its box with the one accent and a check and recedes to faint ink, the
   in-progress item rings its box in the accent and goes medium-weight, a to-do
   item is a hairline box and body ink. The checklist is the natural unit of work
   inside a `plan` phase, where ticking tasks drives the live progress meter; it
   renders as a plain checklist in every other form.

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

5. Body images. Standard Markdown `![alt](src)`. A paragraph that is solely an
   image reference is a block: the engine emits `<figure class="mdp-figure-
   img"><img ...></figure>` at a locked size and aspect per form, the same
   contract as `brand-logo` (an asset slot, not a color, size, or font).
   Mixed into running text, the same syntax stays inline as a small `<img>`.
   The `src` passes the same scheme allowlist as `brand-logo` (`http(s)`, `/`,
   `./`, `../`, and base64 `data:image/*` only); an unsafe or malformed value
   drops the image entirely rather than emitting a broken one. Single-column
   forms (`page`, `report`, `onepager` text cells, `memo`, `letter`, `scroll`,
   `accordion`, `tabs`, `stepper`, `plan`) cap it to the reading column width;
   `onepager` promotes an image section to the full-width row (like
   `compare`/`callout`/`flow`/`quote`); `flyer` caps it tightly for the small
   card; `slides` scales it with the viewport.

There is deliberately no raw HTML, no inline CSS, and no scripting in the
source. Those are the doors slop walks through.

## Forms (v1)

A form is an output shape. The core forms compile by default; the document and
interactive forms are opt-in, together enough to prove the claim that one source
yields many polished outputs.

- `page` a calm scrolling document. The reading form.
- `slides` a full-screen click-through deck. The presenting form.
- `flyer` one composed surface, a poster. The at-a-glance form.
- `report` a paginated long-form document: a cover, an auto table of contents
  built from the `##` headings, and numbered sections. Prints to a clean
  multi-page PDF. The structured reading form.
- `onepager` a single dense sheet: a header band, a packed two-column grid of
  sections, and a footer strip. Print-first. The executive leave-behind.
- `memo` an internal business memo: a To / From / Date / Re header over a tight
  single column. Print-tuned.
- `letter` formal correspondence: a letterhead, date, recipient, salutation,
  body, and sign-off. Print-tuned.
- `scroll` a scroll-driven narrative: each `---` section is a scene that reveals
  as it enters view, with a reading-progress bar and a dot rail. The storytelling
  form.
- `accordion` collapsible stacked sections, built on native `<details>`: scan the
  headings, open the one you need. The reference and FAQ form.
- `tabs` a tabbed explorer: each section becomes a panel, with arrow-key
  navigation and a deep-linkable URL hash. The lateral form.
- `stepper` a guided walkthrough: one numbered step at a time, with a progress bar
  and Back / Next. The process form.
- `plan` an implementation plan: each `---` section is a phase (a collapsible
  `<details>`), the `{.lead}` standfirst is the goal, and a `mdp:tasks` checklist
  inside a phase drives a live progress meter you tick off. Built for the plans
  agents write. The planning form.

The default set (`page, slides, flyer`) compiles when a source omits `forms:`;
the other forms are opt-in via an explicit `forms:` list.

Later: a social card or OG image. (open)

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
| `mdp:table` | bordered table | bordered table | own full-width table |
| `mdp:chart` | bar chart | bar chart | own full-width bar chart |
| `mdp:diagram` | inline SVG | inline SVG | own full-width SVG |
| `mdp:timeline` | rail of steps | rail of steps | own full-width rail |
| `mdp:faq` | disclosures | disclosures | expanded Q/A |
| `mdp:pricing` | tier cards | tier cards | own full-width tier cards |
| `mdp:tasks` | checklist | checklist | checklist |
| `:::callout` | bordered aside | bordered aside | own full-width aside |
| blockquote + `{.cite}` | pull quote | full quote slide | quote block |
| `![alt](src)` alone | full-width figure | full-slide figure | own full-width figure |

The document and interactive forms inherit these readings rather than redefining
them: `report`, `memo`, `letter`, `scroll`, `accordion`, `tabs`, `stepper`, and
`plan` read each block exactly as `page` does, and `onepager` composes them like
`flyer` (full-width bands plus a packed grid).

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
- Additional forms (social card, print) and their mapping rules.
- The name is settled: MDP, for Markdown Presentation, owning the acronym.
