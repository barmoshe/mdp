# mdp-compiler

The MDP engine: compile one `.mdp` source, deterministically, into design-locked
**page**, **slides**, **flyer**, **report**, **one-pager**, **memo**, **letter**,
**scroll**, **accordion**, **tabs**, and **stepper** artifacts. Zero dependencies, pure ESM.

The author writes meaning, never styling. There is no color, size, or font in the
source, so the output cannot drift into the generic "AI look", and the same source
always compiles to byte-identical HTML.

```js
import { compile, parse, ARTIFACTS } from "mdp-compiler";

const source = `---
title: Tidewater
theme: ocean
---

# Tidewater

A quarterly update.
`;

const html = compile(source, "slides"); // "page" | "slides" | "flyer" | "report" | "onepager" | "memo" | "letter" | "scroll" | "accordion" | "tabs" | "stepper"
```

## API

- `compile(source, artifact = "page")` returns the rendered HTML string for one
  artifact (any artifact name: `"page"`, `"slides"`, `"flyer"`, `"report"`,
  `"onepager"`, `"memo"`, `"letter"`, `"scroll"`, `"accordion"`, `"tabs"`,
  or `"stepper"`).
- `parse(source)` returns the semantic tree (frontmatter plus the ordered, closed
  set of body blocks).
- `ARTIFACTS` is the list of artifacts the engine can compile.
- Also exported: `THEMES`, `DEFAULT_THEME`, `THEME_SWATCHES`, `SCHEMA`,
  `SCHEMA_VERSION`, and the `escapeHtml` / `inline` helpers.

## Learn more

- Live playground, docs, and the format spec: https://barmoshe.github.io/mdp/
- Source, examples, and issues: https://github.com/barmoshe/mdp

Apache-2.0.
