// manifest.mjs: the one place that loads and shapes examples/manifest.json.
//
// The manifest is the single source of truth for which example files exist and
// which consumers each one feeds. Every Node consumer (CI helpers, the sync
// scripts, the drift check) imports THIS, so the parse + the role vocabulary
// live in one place. The site reads the JSON directly via a Vite raw glob.
//
// An entry is routing data only: { id, file, label, lead, roles }. Content
// truth (what an example demonstrates, its theme, its blocks) lives in the .mdp
// file and is derived by parsing it, never duplicated here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export const MANIFEST = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));

// The closed role vocabulary. A role not in this set is a typo; check-examples
// fails CI on it so a misrouted file cannot silently drop out of a consumer.
export const ALLOWED_ROLES = ["ci-build", "ci-determinism", "vendor-codex", "vendor-mcp", "site"];

// Entries carrying a given role, in manifest order (deterministic).
export const byRole = (role) => MANIFEST.filter((e) => e.roles.includes(role));
