# mdp-artifact-resume

An [MDP](https://github.com/barmoshe/mdp) **artifact** extension: a resume / CV
output type, alongside the core `page`, `slides`, and `flyer`.

It is a solver over the whole IR: the title block is the name, the lead is the
tagline, a `mdp:stats` block becomes a row of quick facts, headings open sections,
and lists and paragraphs fill them. The result is one complete, standalone HTML
document in the MDP design language.

> Not the same as the `resume` template. mdp-compiler ships a `resume` fill-in
> template, which is a page-form `.mdp` source you edit. This package is a different
> thing: a new output **form** that lays *any* source out as a resume. Same IR, new
> solver.

## Try it

```sh
npm test          # full-document output, escaping, the design lock, determinism
npm run demo      # writes dist/preview.html, open it in a browser
```

Zero dependencies: it runs anywhere Node 18+ does.

## Use it

An artifact takes `{ meta, blocks }` and returns a complete HTML document:

```js
import { renderResume } from "mdp-artifact-resume";
import { parse } from "mdp-compiler"; // the public parser

const html = renderResume(parse(source));
```

It handles `title`, `lead`, `heading`, `paragraph`, `list`, `stats`, and `quote`;
unknown blocks are dropped, mirroring the core renderers' graceful degradation.

## Publish (the convention)

MDP discovers extensions with no central registry, just npm + GitHub search:

1. Keep `"keywords": ["mdp", "mdp-artifact"]` in `package.json` (already set).
2. `npm publish`
3. Add the **`mdp-artifact`** topic to the GitHub repo.

It is then found by `npm search keywords:mdp-artifact` and GitHub's `mdp-artifact`
topic page.

## Wire it into the engine (optional)

`mdp-compiler` has no runtime plugin loader. An artifact runs standalone as
`renderResume(parse(source))`, or you can fork or patch
[`mdp-compiler`](https://github.com/barmoshe/mdp) and add one entry to the
`RENDERERS` map in `packages/core/src/index.mjs`, so the CLI and the playground can
target it by name (`resume`):

```js
import { renderResume } from "mdp-artifact-resume";
// in packages/core/src/index.mjs:
export const RENDERERS = {
  page: renderPage,
  slides: renderSlides,
  flyer: renderFlyer,
  // ...
  resume: renderResume,
};
```

Unlike a block, an artifact owns the whole document, so there is nothing to wire
into the per-form renderers or `content-blocks.mjs`: the one `RENDERERS` entry is all
it takes.

## Note on `_tokens.mjs`

This package vendors a minimal `src/_tokens.mjs` (a small slice of the MDP design
system) so the document is styled without an `mdp-compiler` install. When the engine
is available as a dependency, you can import the full themed system instead:
`import { baseStyle } from "mdp-compiler"`, which honors every named theme in light
and dark.

## License

MIT.
