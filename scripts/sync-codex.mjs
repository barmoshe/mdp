// sync-codex.mjs: refresh the vendored copy of the engine inside the Codex plugin.
//
// The Codex plugin (codex/) must be self-contained: Codex caches a copy of a
// plugin on install, so the plugin cannot reach packages/core/ at the repo root.
// This script copies the engine, the CLI wrapper, the spec, and one example from
// the root into codex/. codex/ is always a faithful COPY of the source, never a
// second source. Run it after any change under packages/core/, bin/, SPEC.md, or
// examples/comparison.mdp:  npm run sync:codex
import { rmSync, mkdirSync, cpSync, copyFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

// 3. The spec and the one example the skill points at.
copyFileSync(join(root, "SPEC.md"), join(codex, "SPEC.md"));
mkdirSync(join(codex, "examples"), { recursive: true });
copyFileSync(join(root, "examples", "comparison.mdp"), join(codex, "examples", "comparison.mdp"));

console.log("Synced codex/ from the repo root: packages/core, bin, SPEC.md, examples/comparison.mdp.");
