# create-mdp-extension

Scaffold a correctly named, tagged, permissively licensed [MDP](https://github.com/barmoshe/mdp)
extension in one command: a **block** (`mdp-block-<name>`) or an **artifact**
(`mdp-artifact-<name>`).

MDP seeds its ecosystem the zero-maintenance way: a naming convention plus an npm
keyword plus a GitHub topic. There is no central registry. This tool makes the
right thing the easy thing.

## Use

```sh
npm create mdp-extension tag-list
# or
npx create-mdp-extension tag-list
```

Make an artifact instead, with the Apache-2.0 license:

```sh
npm create mdp-extension card -- --type artifact --license apache-2.0
```

Then:

```sh
cd mdp-block-tag-list
npm test          # the generated package is self-testing
npm run demo      # writes dist/preview.html - open it
```

## Options

| Flag | Default | Meaning |
|---|---|---|
| `--type <block\|artifact>` | `block` | Kind of extension. |
| `--license <mit\|apache-2.0>` | `mit` | License for the generated package. |
| `--author <name>` | `Your Name` | Author in `package.json` + LICENSE. |
| `--dir <path>` | `./<package-name>` | Where to write. |
| `--year <YYYY>` | `<YEAR>` placeholder | LICENSE copyright year. |
| `--scope <@scope>` | none | Publish as `@scope/mdp-<type>-<name>`. |
| `-y, --yes` | off | Non-interactive: flags + defaults, no prompts. |
| `--force` | off | Write into a non-empty directory. |

Run with no name in a terminal and it prompts for the missing pieces. With
`--yes` (or no TTY, e.g. CI) it takes flags and defaults and never blocks.

## What you get

A zero-dependency package that runs anywhere Node 18+ does:

- `src/index.mjs` - the extension, shaped like the engine's own blocks
  (a `STYLE` string + a `render` function). Author content is escaped through a
  vendored copy of the engine's `inline()`.
- `test/index.test.mjs` - `node --test` assertions for markup, escaping, the
  design lock (tokens only, logical properties), and determinism.
- `demo.mjs` - renders a sample into `dist/preview.html` so you can see it.
- `package.json` with the required `keywords` (`mdp` + `mdp-block` /
  `mdp-artifact`), `README.md`, `LICENSE`, `.gitignore`.

The generated README explains how to publish (the keyword + the GitHub topic) and
how to wire the extension into a document.

## The convention

See [CONTRIBUTING.md](https://github.com/barmoshe/mdp/blob/main/CONTRIBUTING.md#extensions)
in the MDP repo for the full naming / keyword / topic convention.

## License

Apache-2.0. Part of the [MDP](https://github.com/barmoshe/mdp) monorepo.
