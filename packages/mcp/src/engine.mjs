// engine.mjs: the single in-package import path for the compiler.
// Resolves to the VENDORED copy under ../engine (refreshed by `npm run
// sync:mcp`), both in a checkout and in the published package. One shim means a
// future switch to a published @mdp/core dependency is a one-line edit.
export { compile, parse, ARTIFACTS } from "../engine/index.mjs";
