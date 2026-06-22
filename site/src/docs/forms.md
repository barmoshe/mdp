# Forms

A form is an output shape. One source compiles into every form it lists in
`forms`. The set covers visual forms, document forms, and interactive forms, all
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
- **scroll** a scroll-driven narrative: each `---` section is a scene that reveals
  as it enters view, with a progress bar and a dot rail. The storytelling form.
- **accordion** collapsible stacked sections, built on native `<details>`. Scan
  the headings, open the one you need. The reference and FAQ form.
- **tabs** a tabbed explorer: each section is a panel you switch between, with
  arrow-key navigation and a deep-linkable URL hash. The lateral form.
- **stepper** a guided walkthrough: one numbered step at a time, with a progress
  bar and Back / Next. The process form.

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
| `mdp:table` | bordered table | bordered table | own full-width table |
| `mdp:chart` | bar chart | bar chart | own full-width bar chart |
| `mdp:diagram` | inline SVG | inline SVG | own full-width SVG |
| `mdp:timeline` | rail of steps | rail of steps | own full-width rail |
| `mdp:faq` | disclosures | disclosures | expanded Q/A |
| `mdp:pricing` | tier cards | tier cards | own full-width tier cards |
| `:::callout` | bordered aside | bordered aside | own full-width aside |
| blockquote + `{.cite}` | pull quote | full quote slide | quote block |

The other forms reuse these block readings rather than redefining them:
**report**, **memo**, **letter**, and the interactive forms (**scroll**,
**accordion**, **tabs**, **stepper**) render each block exactly as **page** does;
**one-pager** composes them like **flyer** (full-width bands and a packed grid).
Only the surrounding structure differs.

## Presenting the deck

The slides form is a real deck. Once it is open in a browser:

- **Arrow keys** or **space** move between slides.
- **F** toggles fullscreen (there is also a button).
- **Cmd or Ctrl + P** prints to PDF, one slide per page.
- List and step items reveal one at a time.

## Using the interactive forms

The interactive forms enhance the same content with JavaScript, and every one
degrades to readable HTML when scripting is off:

- **scroll** reveals each scene as it scrolls into view; a progress bar tracks
  position and a dot rail jumps between scenes.
- **accordion** opens and closes sections (native `<details>`, so it works with no
  JavaScript); Expand all / Collapse all act on every panel.
- **tabs** switches panels on click or with the arrow keys, and opens the tab
  named in the URL hash.
- **stepper** moves through numbered steps with Back / Next, the arrow keys, or a
  click on the step rail.

Motion is disabled under `prefers-reduced-motion`, and every form keeps WCAG AA
contrast and full keyboard navigation.

## Choosing forms

List only the forms you want in the frontmatter:

```text
forms: [page, slides, flyer]
```

From the command line you can also compile a single form with `--only`, or open
one with `--open`. See the [CLI reference](#/docs/cli).

Omitting `forms` compiles the three core forms (`page`, `slides`, `flyer`). Every
other form (the document forms `report`, `onepager`, `memo`, `letter` and the
interactive forms `scroll`, `accordion`, `tabs`, `stepper`) is opt-in: name it
explicitly, for example `forms: [scroll]`.

Further forms arrive as new solvers over the same semantic representation, with no
change to the sources you already wrote.
