# Forms

A form is an output shape. One source compiles into every form it lists in
`forms`. v1 ships three, which is enough to prove the claim that one source
yields many polished outputs.

- **page** a calm scrolling document. The reading form.
- **slides** a full-screen click-through deck. The presenting form.
- **flyer** one composed surface, a poster or one-pager. The at-a-glance form.

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

Later forms, such as a social card or a paginated print, are open questions. They
arrive as new solvers over the same semantic representation, with no change to the
sources you already wrote.
