// sync-extension-vendor.mjs: refresh the vendored escaper that the scaffolder
// ships inside every generated extension.
//
// Generated extension packages are zero-dependency, so they carry a verbatim
// copy of @mdp/core's inline.mjs as src/_inline.mjs (escaping is security
// critical and must never be re-implemented from memory). This copies the
// current core file into both the block and artifact templates. The drift gate
// in scripts/check-scaffold.mjs fails CI if they are ever out of sync, the same
// way sync:codex / sync:mcp keep their vendored copies fresh.

import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "packages/core/src/inline.mjs");

for (const type of ["block", "artifact"]) {
  const dest = join(
    ROOT,
    `packages/create-mdp-extension/templates/${type}/src/_inline.mjs.tmpl`
  );
  copyFileSync(SRC, dest);
  process.stdout.write(`synced ${dest}\n`);
}
