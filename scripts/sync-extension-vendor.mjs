// sync-extension-vendor.mjs: refresh the vendored core modules that the
// scaffolder ships inside every generated extension.
//
// Generated extension packages are zero-dependency, so they carry a verbatim
// copy of mdp-compiler's inline.mjs as src/_inline.mjs (escaping is security
// critical and must never be re-implemented from memory). inline.mjs also renders
// inline color swatches, so it now imports color.mjs, which imports
// named-colors.mjs; those two are vendored alongside it under their real names so
// the verbatim import chain resolves with no dependency and no re-implementation.
// This copies the current core files into both the block and artifact templates.
// The drift gate in scripts/check-scaffold.mjs fails CI if any are out of sync,
// the same way sync:codex / sync:mcp keep their vendored copies fresh.

import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// [core source file, vendored template name]. The escaper takes a `_` prefix (the
// scaffold's index imports it as ./_inline.mjs); its transitive deps keep their
// real names so the verbatim `import "./color.mjs"` chain resolves as-is.
export const VENDORED = [
  ["inline.mjs", "_inline.mjs.tmpl"],
  ["color.mjs", "color.mjs.tmpl"],
  ["named-colors.mjs", "named-colors.mjs.tmpl"],
];

for (const type of ["block", "artifact"]) {
  for (const [srcName, destName] of VENDORED) {
    const src = join(ROOT, "packages/core/src", srcName);
    const dest = join(ROOT, `packages/create-mdp-extension/templates/${type}/src/${destName}`);
    copyFileSync(src, dest);
    process.stdout.write(`synced ${dest}\n`);
  }
}
