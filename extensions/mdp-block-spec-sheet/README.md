# mdp-block-spec-sheet

An [MDP](https://github.com/barmoshe/mdp) **block** extension: a compact spec sheet.

It renders a titled list of key/value pairs (display, weight, battery, ...) as a
definition list in two aligned columns, in the MDP design language.

## Try it

```sh
npm test          # parse + markup, escaping, the design lock, determinism
npm run demo      # writes dist/preview.html, open it in a browser
```

Zero dependencies: it runs anywhere Node 18+ does.

## The source it is designed for

A block adds a fenced directive the host turns into an IR node. Each line is a
`key: value` pair; a `title:` line sets the sheet title:

````
```mdp:spec-sheet
title: Tidewater 12
Display: 6.1 inch OLED
Weight: 184 g
Battery: 3200 mAh
```
````

The IR node this package renders:

```js
{ type: "spec-sheet", title, rows: [ { key, value }, ... ] }   // title is optional
```

It exports the engine's block shape (a STYLE string and a render function), plus a
`parseSpecSheet(body)` convenience that turns the fenced body into the node above
(a host may use it or its own parser):

```js
import { renderSpecSheet, parseSpecSheet, SPEC_SHEET_STYLE } from "mdp-block-spec-sheet";
```

## Publish (the convention)

MDP discovers extensions with no central registry, just npm + GitHub search:

1. Keep `"keywords": ["mdp", "mdp-block"]` in `package.json` (already set).
2. `npm publish`
3. Add the **`mdp-block`** topic to the GitHub repo.

It is then found by `npm search keywords:mdp-block` and GitHub's `mdp-block` topic page.

## Use it in a document

`mdp-compiler` has no runtime plugin loader, so the host wires a block in. To render
`mdp:spec-sheet` across every form, fork or patch
[`mdp-compiler`](https://github.com/barmoshe/mdp) and wire it in three places:

1. **Parse**, in `packages/core/src/parse.mjs`, emit the node for the fence. You can
   reuse this package's parser:

   ```js
   import { parseSpecSheet } from "mdp-block-spec-sheet";
   // ...
   } else if (fenceInfo === "mdp:spec-sheet") {
     blocks.push(parseSpecSheet(bodyLines.join("\n")));
   }
   ```

2. **Per-form renderers**, in each of `render-page.mjs`, `render-slides.mjs`, and
   `render-flyer.mjs`: import this package, add a `case` to the block switch, and
   inject the STYLE where the other block styles are injected:

   ```js
   import { renderSpecSheet, SPEC_SHEET_STYLE } from "mdp-block-spec-sheet";
   // in the stylesheet:   ${SPEC_SHEET_STYLE}
   // in the block switch:  case "spec-sheet": return renderSpecSheet(block);
   ```

3. **The shared interactive renderer** (do not skip this one), in
   `packages/core/src/content-blocks.mjs`: add the same `case` to `renderContentBlock`
   and add `SPEC_SHEET_STYLE` to the `CONTENT_BLOCK_STYLE` array. That single file is
   what makes the block render in all four interactive forms (scroll, accordion, tabs,
   stepper). A block wired only into page/slides/flyer renders blank in those four.

   ```js
   import { renderSpecSheet, SPEC_SHEET_STYLE } from "mdp-block-spec-sheet";
   // add SPEC_SHEET_STYLE to the CONTENT_BLOCK_STYLE array
   // in renderContentBlock's switch:  case "spec-sheet": return renderSpecSheet(block);
   ```

An unknown fence already degrades to readable text, so an un-wired block never breaks
a document.

## License

MIT.
