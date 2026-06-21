// manifest.mjs: loads templates/manifest.json. Same shape as examples/manifest.mjs.
//
// A template is a fill-in starter a user copies; the manifest routes which
// consumers vendor or surface each one. Routing data only: { id, file, label,
// lead, roles }. Content lives in the .mdp file.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export const MANIFEST = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));

// Templates have their own smaller role set (no CI-determinism singling-out;
// every template is in the build + determinism loop by globbing).
export const ALLOWED_ROLES = ["vendor-codex", "vendor-mcp", "site-template"];

export const byRole = (role) => MANIFEST.filter((e) => e.roles.includes(role));
