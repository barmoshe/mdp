#!/usr/bin/env node
// create-mdp-extension: the bin entry. Thin wrapper that hands argv to the CLI
// and maps the returned status code to the process exit code.

import { main } from "../src/cli.mjs";

main(process.argv.slice(2))
  .then((code) => process.exit(code || 0))
  .catch((err) => {
    process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
    process.exit(1);
  });
