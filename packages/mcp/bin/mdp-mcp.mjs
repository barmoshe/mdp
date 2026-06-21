#!/usr/bin/env node
// bin/mdp-mcp.mjs: the published entry point (the package `bin` target).
// Self-locating like bin/mdp at the repo root; the server's only interface is the
// stdio JSON-RPC channel, so there is no argv parsing here.
import { startServer } from "../src/server.mjs";

startServer().catch((err) => {
  // Last-resort guard. NEVER write to stdout (it is the protocol channel).
  process.stderr.write(`[mdp-mcp] fatal: ${err?.stack || err}\n`);
  process.exit(1);
});
