// io.mjs: delivery plumbing shared by the tools.
//   - resolveOutDir: explicit arg > $MDP_OUT_DIR > <os tmp>/mdp-mcp. NEVER
//     process.cwd() (under npx the cwd is the caller's and may be unwritable or
//     unrelated). Always returns an ABSOLUTE path.
//   - artifactFilename: mdp-<sha256(source).slice(0,8)>-<form>.html, so the same
//     source always lands on the same path (idempotent, cacheable).
//   - writeArtifact: ensure dir, write utf8, return { form, path(abs), bytes }.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

export function sourceHash(source) {
  return createHash("sha256").update(String(source), "utf8").digest("hex").slice(0, 8);
}

export function resolveOutDir(outDirArg) {
  if (outDirArg && String(outDirArg).trim()) return resolve(String(outDirArg));
  if (process.env.MDP_OUT_DIR && process.env.MDP_OUT_DIR.trim()) return resolve(process.env.MDP_OUT_DIR);
  return join(tmpdir(), "mdp-mcp");
}

export function artifactFilename(source, form) {
  return `mdp-${sourceHash(source)}-${form}.html`;
}

export function writeArtifact(dir, source, form, html) {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, artifactFilename(source, form));
  writeFileSync(path, html, "utf8");
  return { form, path, bytes: Buffer.byteLength(html, "utf8") };
}
