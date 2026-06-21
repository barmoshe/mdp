# CLI reference

The engine ships a small command-line build tool. No install, no build step, no
bundler: it is plain Node ESM and runs with `node` directly.

```bash
node packages/core/build.mjs <source.mdp> [options]
```

If you omit the source, it builds the bundled `examples/block-compare.mdp`. By
default it compiles all three artifacts.

## Options

| Option | Effect |
|---|---|
| `--out <dir>` | Write the artifacts to `<dir>` instead of `dist/`. |
| `--only <artifact>` | Build just one of `page`, `slides`, or `flyer`. |
| `--theme <name>` | Override the frontmatter theme with one of the 11 named themes. |
| `--open [artifact]` | Show or present in the browser after building. With no name it opens the first built artifact. |

## Examples

Build all three artifacts into `dist/`:

```bash
node packages/core/build.mjs examples/block-compare.mdp
```

Present the deck:

```bash
node packages/core/build.mjs examples/block-compare.mdp --open slides
```

Build only the flyer, into a custom folder:

```bash
node packages/core/build.mjs brief.mdp --only flyer --out build
```

From the repo root, `npm run build` and `pnpm build` are shortcuts for
`node packages/core/build.mjs`.

## Determinism

The compile is pure: no clocks, no randomness, stable iteration order. Running
the build twice produces byte-identical files. `--open` is a side effect only; it
opens the result and never changes the output bytes. The continuous-integration
build verifies this on every push by compiling twice and diffing the hashes.
