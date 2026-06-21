// sync-codex.mjs: refresh the vendored copy of the engine inside the Codex plugin.
//
// The Codex plugin (codex/) must be self-contained: Codex caches a copy of a
// plugin on install, so the plugin cannot reach packages/core/ at the repo root.
// This copies the engine, the CLI wrapper, the spec, and the manifest-selected
// example(s) (plus any template tagged vendor-codex) into codex/. codex/ is
// always a faithful COPY of the source, never a second source. The example set
// is read from examples/manifest.json (no hardcoded filenames). Run it after any
// change under packages/core/, bin/, SPEC.md, or the vendored seed files:
//   npm run sync:codex
import { rmSync, mkdirSync, cpSync, copyFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { byRole as exByRole } from "../examples/manifest.mjs";
import { byRole as tmplByRole } from "../templates/manifest.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const codex = join(root, "codex");

// 1. The engine (packages/core), copied whole after clearing any stale files.
rmSync(join(codex, "packages"), { recursive: true, force: true });
mkdirSync(join(codex, "packages"), { recursive: true });
cpSync(join(root, "packages", "core"), join(codex, "packages", "core"), { recursive: true });

// 2. The self-locating CLI wrapper (preserve the executable bit on the shell one).
mkdirSync(join(codex, "bin"), { recursive: true });
for (const f of ["mdp", "mdp.cmd"]) copyFileSync(join(root, "bin", f), join(codex, "bin", f));
chmodSync(join(codex, "bin", "mdp"), 0o755);

// 3. The spec and the manifest-selected examples the skill points at.
copyFileSync(join(root, "SPEC.md"), join(codex, "SPEC.md"));
rmSync(join(codex, "examples"), { recursive: true, force: true });
mkdirSync(join(codex, "examples"), { recursive: true });
const codexExamples = exByRole("vendor-codex");
for (const e of codexExamples) copyFileSync(join(root, "examples", e.file), join(codex, "examples", e.file));

// 4. Any template tagged vendor-codex (none today; mirrors the examples copy).
rmSync(join(codex, "templates"), { recursive: true, force: true });
const codexTemplates = tmplByRole("vendor-codex");
if (codexTemplates.length) {
  mkdirSync(join(codex, "templates"), { recursive: true });
  for (const e of codexTemplates) copyFileSync(join(root, "templates", e.file), join(codex, "templates", e.file));
}

console.log(
  `Synced codex/ from the repo root: packages/core, bin, SPEC.md, ` +
    `${codexExamples.length} example(s) [${codexExamples.map((e) => e.file).join(", ")}]` +
    `${codexTemplates.length ? `, ${codexTemplates.length} template(s)` : ""}.`
);
