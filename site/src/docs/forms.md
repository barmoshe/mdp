# Forms

A form is an output shape. One source compiles into every form it lists in
`forms`. Seven ship today: three visual forms and four document forms, all
solvers over the same semantic representation.

- **page** a calm scrolling document. The reading form.
- **slides** a full-screen click-through deck. The presenting form.
- **flyer** one composed surface, a poster. The at-a-glance form.
- **report** a paginated long-form document: a cover, an auto table of contents
  from the `##` headings, and numbered sections. The structured reading form.
- **one-pager** a single dense sheet: a header band, a packed two-column grid,
  and a footer. Print-first. The executive leave-behind.
- **memo** an internal business memo: a To / From / Date / Re header over a tight
  single column.
- **letter** formal correspondence: letterhead, date, salutation, body, and
  sign-off.

The renderer, not the file, owns presentation. The same blocks compile
differently per form.

## How a source maps to each form

| Block | page | slides | flyer |
|---|---|---|---|
| First `#` + `{.lead}` | masthead and standfirst | title slide | flyer header |
| `##` heading | section heading in flow | slide heading | surface section |
| `---` | section divider | slide break | panel divider |
| list or ordered list | inline list | one item per reveal | compact list |
| `mdp:stats` | table | big figures | figure band |
| `mdp:compare` | card grid | own card slide | own full-width grid |
| `mdp:flow` | chip row | chip row | own full-width chip row |
| `:::callout` | bordered aside | bordered aside | own full-width aside |
| blockquote + `{.cite}` | pull quote | full quote slide | quote block |

The four document forms reuse these block readings: **report**, **memo**, and
**letter** render each block exactly as **page** does; **one-pager** composes them
like **flyer** (full-width bands and a packed grid). Only the surrounding
structure differs.

## Presenting the deck

The slides form is a real deck. Once it is open in a browser:

- **Arrow keys** or **space** move between slides.
- **F** toggles fullscreen (there is also a button).
- **Cmd or Ctrl + P** prints to PDF, one slide per page.
- List and step items reveal one at a time.

## Choosing forms

List only the forms you want in the frontmatter:

```text
forms: [page, slides, flyer]
```

From the command line you can also compile a single form with `--only`, or open
one with `--open`. See the [CLI reference](#/docs/cli).

Omitting `forms` compiles the three core forms (`page`, `slides`, `flyer`). The
document forms (`report`, `onepager`, `memo`, `letter`) are opt-in: name them
explicitly, for example `forms: [report]`.

Further forms arrive as new solvers over the same semantic representation, with no
change to the sources you already wrote.
