// sync-mcp.mjs: refresh the vendored engine + assets inside packages/mcp.
//
// packages/mcp is published to npm as `mdp-mcp` and must be self-contained: npx
// fetches only what its package.json `files` lists, and it cannot reach
// packages/core at the repo root. This copies the engine SOURCE and the spec +
// canonical examples into the package. packages/mcp/engine and
// packages/mcp/assets are always a faithful COPY, never a second source. Run it
// after any change under packages/core/src, SPEC.md, or examples/:
//   npm run sync:mcp
import { rmSync, mkdirSync, cpSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mcp = join(root, "packages", "mcp");

// 1. The engine: packages/core/src -> packages/mcp/engine (clear stale first).
//    Vendor src only; the server calls compile()/parse() directly, never the CLI
//    (build.mjs), so the CLI is intentionally left out.
rmSync(join(mcp, "engine"), { recursive: true, force: true });
mkdirSync(join(mcp, "engine"), { recursive: true });
cpSync(join(root, "packages", "core", "src"), join(mcp, "engine"), { recursive: true });

// 2. Assets for the MCP resources: the spec and the two example sources.
rmSync(join(mcp, "assets"), { recursive: true, force: true });
mkdirSync(join(mcp, "assets", "examples"), { recursive: true });
copyFileSync(join(root, "SPEC.md"), join(mcp, "assets", "SPEC.md"));
for (const ex of ["comparison.mdp", "tidewater.mdp"]) {
  copyFileSync(join(root, "examples", ex), join(mcp, "assets", "examples", ex));
}

// 3. The license, so the published package carries it.
copyFileSync(join(root, "LICENSE"), join(mcp, "LICENSE"));

console.log(
  "Synced packages/mcp from the repo root: engine (packages/core/src), SPEC.md, examples/{comparison,tidewater}.mdp, LICENSE."
);
