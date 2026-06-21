# The format

An MDP file is a superset of CommonMark: any valid `.mdp` file is also readable
as plain Markdown. It is optional YAML frontmatter, then a Markdown body. The
extension is `.mdp`, UTF-8.

The guiding principle: **the author cannot style.** There is no color, size, or
font in the source. Slop becomes structurally impossible, not something you
prompt against.

## Frontmatter

```text
---
mdp: 1                       # format version, required
theme: studio                # one of 11 themes; see Themes & design
forms: [page, slides, flyer] # which forms to compile
title: Tidewater Coffee      # optional, defaults to the first heading
kicker: Brief                # optional, the small eyebrow above the masthead
lang: he                     # optional, document language, default "en"
dir: rtl                     # optional, writing direction, inferred from lang
---
```

| Field | Meaning |
|---|---|
| `mdp` | Format version. Required. Currently `1`. |
| `theme` | A named theme from a fixed set. Never raw colors. Unknown names fall back to `studio`. |
| `forms` | Which presentation forms this source supports. |
| `title` | The masthead title. Defaults to the first `#` heading. |
| `kicker` | The small eyebrow label above the masthead. Defaults to `Brief`. |
| `lang` | Document language on the root element. Defaults to `en`. |
| `dir` | `ltr` or `rtl`. If omitted, inferred from `lang`. |

`theme` selects a designed system, not individual styles. Every theme shares one
warm neutral ramp and differs only in a single restrained accent. See
[themes](#/docs/themes).

`lang` and `dir` set the document language and writing direction. `dir` is
inferred as `rtl` for `he`, `ar`, `fa`, `ur`, and `yi` (matched on the primary
subtag), else `ltr`. An explicit `dir` always wins. Because the renderer uses
logical CSS throughout, setting `dir: rtl` flips the whole layout automatically;
the author never positions anything.

## Body

Standard Markdown blocks work as you expect: headings, paragraphs, lists,
ordered lists, blockquotes, fenced code, images, links, and tables.

On top of plain Markdown there is a small, closed set of additions:

### Section breaks

A thematic break (`---` on its own line) marks a boundary. It is a section
divider on a page, a slide break in slides, and a panel divider on a flyer. If no
MDP renderer runs, it is just a horizontal rule.

### Line roles

A block may open with a role tag in braces:

- `{.lead}` a standfirst or subtitle, set in serif.
- `{.cite}` an attribution line, for example under a quote.

```text
# Tidewater Coffee
{.lead} A single-origin subscription for people who care where their coffee comes from.
```

A role the renderer does not know is ignored, and the text renders plainly.

### Fenced directives and containers

The richer blocks (`mdp:stats`, `mdp:compare`, `mdp:flow`, and `:::callout`) have
their own page. See [blocks](#/docs/blocks) for the full grammar.

## Forgiving by design

Wrong input still renders. An unknown directive or a malformed block degrades to
readable text, never a blank or black screen. There is deliberately no raw HTML,
no inline CSS, and no scripting in the source: those are the doors slop walks
through.
