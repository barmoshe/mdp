# mdp-block-status

An [MDP](https://github.com/barmoshe/mdp) **block** extension: inline status pills.

It renders a row of small pills, say a roadmap line reading "Shipped", "In review",
"Planned", in the MDP design language (one restrained accent, no free color).

## Try it

```sh
npm test          # markup, escaping, the design lock, determinism
npm run demo      # writes dist/preview.html, open it in a browser
```

Zero dependencies: it runs anywhere Node 18+ does.

## The source it is designed for

A block adds a fenced directive the host turns into an IR node. Each line is a
`label: tone` pair; a line with no colon is a label with the default tone:

````
```mdp:status
Shipped: solid
In review: accent
Planned
```
````

The IR node this package renders:

```js
{ type: "status", items: [ { label, tone }, ... ] }   // tone: "default" | "accent" | "solid"
```

It exports the engine's block shape, a STYLE string and a render function:

```js
import { renderStatus, STATUS_STYLE } from "mdp-block-status";
```

## Tones

The design lock has one accent and no free color, so the tones are emphasis levels
built from the engine tokens, not hues:

- `default`: a calm neutral pill (surface, border).
- `accent`: the soft accent treatment (accent-surface, accent-border, accent-text).
- `solid`: the accent fill, with on-fill text (accent-contrast).

An unknown tone clamps to `default`, so a stray value never reaches the class list.

## Publish (the convention)

MDP discovers extensions with no central registry, just npm + GitHub search:

1. Keep `"keywords": ["mdp", "mdp-block"]` in `package.json` (already set).
2. `npm publish`
3. Add the **`mdp-block`** topic to the GitHub repo.

It is then found by `npm search keywords:mdp-block` and GitHub's `mdp-block` topic page.

## Use it in a document

`mdp-compiler` has no runtime plugin loader, so the host wires a block in. To render
`mdp:status` across every form, fork or patch
[`mdp-compiler`](https://github.com/barmoshe/mdp) and wire it in three places:

1. **Parse**, in `packages/core/src/parse.mjs`, emit the node for the fence (model it
   on the `mdp:flow` branch):

   ```js
   } else if (fenceInfo === "mdp:status") {
     const items = bodyLines.filter(Boolean).map((line) => {
       const i = line.indexOf(":");
       if (i === -1) return { label: line.trim(), tone: "default" };
       return { label: line.slice(0, i).trim(), tone: line.slice(i + 1).trim() };
     });
     blocks.push({ type: "status", items });
   }
   ```

2. **Per-form renderers**, in each of `render-page.mjs`, `render-slides.mjs`, and
   `render-flyer.mjs`: import this package, add a `case` to the block switch, and
   inject the STYLE where the other block styles are injected:

   ```js
   import { renderStatus, STATUS_STYLE } from "mdp-block-status";
   // in the stylesheet:   ${STATUS_STYLE}
   // in the block switch:  case "status": return renderStatus(block);
   ```

3. **The shared interactive renderer** (do not skip this one), in
   `packages/core/src/content-blocks.mjs`: add the same `case` to `renderContentBlock`
   and add `STATUS_STYLE` to the `CONTENT_BLOCK_STYLE` array. That single file is what
   makes the block render in all four interactive forms (scroll, accordion, tabs,
   stepper). A block wired only into page/slides/flyer renders blank in those four.

   ```js
   import { renderStatus, STATUS_STYLE } from "mdp-block-status";
   // add STATUS_STYLE to the CONTENT_BLOCK_STYLE array
   // in renderContentBlock's switch:  case "status": return renderStatus(block);
   ```

An unknown fence already degrades to readable text, so an un-wired block never breaks
a document.

## License

MIT.
