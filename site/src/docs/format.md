# The format

An MDP file is a superset of CommonMark: any valid `.mdp` file is also readable
as plain Markdown. It is optional YAML frontmatter, then a Markdown body. The
extension is `.mdp`, UTF-8.

The guiding principle: **the author cannot style.** There is no free styling in
the source, no sizes and no fonts, and the only color you name is a brand color
the engine derives, places, and gates. Slop becomes structurally impossible, not
something you prompt against.

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
brand-logo: ./logo.svg       # optional, a brand mark placed in the masthead
brand-accent: #2f8f6b        # optional, one brand hex; engine derives the accent set
brand-accent-2: #e8a33d      # optional, a secondary brand hex for a few accents
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
| `brand-logo` | A brand logo the engine places in the masthead: a URL, a relative path, or a base64 `data:image` URI. Validated and sanitized; an unsafe or missing value renders no logo. |
| `brand-accent` | A custom brand color: one 6-digit hex (with a leading `#`). The engine derives the full accent set (five roles, light and dark) from it, all WCAG AA. A malformed or inaccessible value falls back to `theme`. |
| `brand-accent-2` | An optional secondary brand color (6-digit hex), used sparingly in a few engine-chosen accents (the title underline, flow connectors, the active slide dot). Applies only alongside `brand-accent`. |

`theme` selects a designed system, not individual styles. Every theme shares one
warm neutral ramp and differs only in a single restrained accent. See
[themes](#/docs/themes).

`lang` and `dir` set the document language and writing direction. `dir` is
inferred as `rtl` for `he`, `ar`, `fa`, `ur`, and `yi` (matched on the primary
subtag), else `ltr`. An explicit `dir` always wins. Because the renderer uses
logical CSS throughout, setting `dir: rtl` flips the whole layout automatically;
the author never positions anything.

`brand-logo` is one narrow amendment to "the author cannot style": an optional
brand mark the engine places in the masthead at a locked size and position
(flipped under `dir: rtl`). You supply only the asset reference, never its size,
place, or repeat. The value passes a scheme allowlist (`http(s)`, a relative path,
or a base64 `data:image/...` URI) and renders as an `<img>`, never inline `<svg>`,
so it cannot smuggle script.

`brand-accent` is the other amendment: name one brand color as a 6-digit hex and
the engine re-lights it into the full accent set, the fill, the on-fill label, the
link and label text, a surface wash, and a border, for both light and dark. Every
load-bearing role is gated to WCAG AA, exactly as the named themes are, so a brand
color can never make the page unreadable. It overrides only the accent; the warm
neutral ramp and the type scale stay put. A malformed value (quoted, missing the
`#`, or not six hex digits), or a color that cannot be made accessible, is ignored
and the document falls back to its named `theme`. `brand-accent-2` names an
optional second color the engine uses sparingly, in the title underline, the flow
connectors, and the active slide dot, and applies only alongside `brand-accent`.
You pick the colors; the engine still owns where they land.

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
