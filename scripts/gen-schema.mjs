// gen-schema.mjs: regenerate spec/schema.json from the engine's SCHEMA export.
//
// The schema is authored once in packages/core/src/schema.mjs (so it travels
// with the vendored engine and bundles in the browser). This writes the
// published JSON artifact from that single source. CI runs it and fails if the
// committed spec/schema.json is stale (same posture as gen-docs / sync-codex).
//
// Run: npm run gen:schema
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SCHEMA } from "../packages/core/src/index.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, "spec", "schema.json");
writeFileSync(out, JSON.stringify(SCHEMA, null, 2) + "\n");
console.log(`wrote ${out} (schema v${SCHEMA.version})`);
