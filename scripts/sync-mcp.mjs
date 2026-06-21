// sync-mcp.mjs: refresh the vendored engine + assets inside packages/mcp.
//
// packages/mcp is published to npm as `mdp-mcp` and must be self-contained: npx
// fetches only what its package.json `files` lists, and it cannot reach
// packages/core at the repo root. This copies the engine SOURCE, the spec, the
// manifest-selected example + template sources, and a filtered manifest per kind
// so the published server enumerates exactly what shipped. packages/mcp/engine
// and packages/mcp/assets are always a faithful COPY, never a second source. The
// seed sets are read from the manifests (no hardcoded filenames). Run it after
// any change under packages/core/src, SPEC.md, or the vendored seed files:
//   npm run sync:mcp
import { rmSync, mkdirSync, cpSync, copyFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { byRole as exByRole } from "../examples/manifest.mjs";
import { byRole as tmplByRole } from "../templates/manifest.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mcp = join(root, "packages", "mcp");

// 1. The engine: packages/core/src -> packages/mcp/engine (clear stale first).
rmSync(join(mcp, "engine"), { recursive: true, force: true });
mkdirSync(join(mcp, "engine"), { recursive: true });
cpSync(join(root, "packages", "core", "src"), join(mcp, "engine"), { recursive: true });

// 2. Assets: the spec, the vendored example + template sources, and a filtered
//    manifest per kind (routing fields only) so the server lists exactly what
//    it ships.
rmSync(join(mcp, "assets"), { recursive: true, force: true });
mkdirSync(join(mcp, "assets", "examples"), { recursive: true });
mkdirSync(join(mcp, "assets", "templates"), { recursive: true });
copyFileSync(join(root, "SPEC.md"), join(mcp, "assets", "SPEC.md"));

const slim = (e) => ({ id: e.id, file: e.file, label: e.label, lead: e.lead });

const vendoredExamples = exByRole("vendor-mcp");
for (const e of vendoredExamples) copyFileSync(join(root, "examples", e.file), join(mcp, "assets", "examples", e.file));
writeFileSync(join(mcp, "assets", "examples", "manifest.json"), JSON.stringify(vendoredExamples.map(slim), null, 2) + "\n");

const vendoredTemplates = tmplByRole("vendor-mcp");
for (const e of vendoredTemplates) copyFileSync(join(root, "templates", e.file), join(mcp, "assets", "templates", e.file));
writeFileSync(join(mcp, "assets", "templates", "manifest.json"), JSON.stringify(vendoredTemplates.map(slim), null, 2) + "\n");

// 3. The license, so the published package carries it.
copyFileSync(join(root, "LICENSE"), join(mcp, "LICENSE"));

console.log(
  `Synced packages/mcp from the repo root: engine, SPEC.md, ` +
    `${vendoredExamples.length} example(s) + ${vendoredTemplates.length} template(s) (with manifests), LICENSE.`
);
