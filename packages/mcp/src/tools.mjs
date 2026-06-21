// tools.mjs: the three tool handlers as PURE async functions. No SDK, no stdio,
// no zod. server.mjs wraps these for MCP; test.mjs calls them directly. This
// seam keeps all logic out of the SDK glue, so SDK churn touches only server.mjs.
import { compile, parse, ARTIFACTS } from "./engine.mjs";
import { resolveOutDir, writeArtifact } from "./io.mjs";
import { startPreview } from "./present.mjs";

function formsFor(form) {
  if (form === "all") return ARTIFACTS;
  if (ARTIFACTS.includes(form)) return [form];
  throw new Error(`Unknown form "${form}". Expected one of: ${ARTIFACTS.join(", ")}, all.`);
}

// mdp_compile: compile -> write file(s) -> return absolute path(s) + bytes.
// No browser. Deterministic.
export async function mdpCompile({ source, form = "page", out_dir } = {}) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("mdp_compile requires a non-empty `source` string.");
  }
  const dir = resolveOutDir(out_dir);
  const artifacts = formsFor(form).map((f) => writeArtifact(dir, source, f, compile(source, f)));
  return { ok: true, out_dir: dir, artifacts };
}

// mdp_validate: parse() only; never throws (parse degrades by design). Returns a
// structured report so an agent can self-correct before rendering.
export async function mdpValidate({ source } = {}) {
  if (typeof source !== "string") {
    return { ok: false, issues: ["`source` must be a string."], meta: {}, blocks: {} };
  }
  try {
    const { meta, blocks } = parse(source);
    const counts = {};
    for (const b of blocks) counts[b.type] = (counts[b.type] || 0) + 1;
    const issues = [];
    if (blocks.length === 0) issues.push("No content blocks were parsed.");
    if (!counts.title && !(meta && meta.title)) issues.push("No title block or frontmatter title.");
    if (meta && meta.mdp !== undefined && meta.mdp !== 1) {
      issues.push(`Frontmatter mdp version is ${meta.mdp}; the engine targets 1.`);
    }
    return { ok: issues.length === 0, meta, blocks: counts, issues };
  } catch (err) {
    return { ok: false, issues: [`parse failed: ${err.message}`], meta: {}, blocks: {} };
  }
}

// mdp_present: compile one artifact (default slides), serve on loopback, open the
// browser, return the URL + absolute path. "all" makes no sense to present, so it
// coerces to slides.
export async function mdpPresent({ source, form = "slides", out_dir } = {}) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("mdp_present requires a non-empty `source` string.");
  }
  if (form === "all") form = "slides";
  const dir = resolveOutDir(out_dir);
  const [artifact] = formsFor(form).map((f) => writeArtifact(dir, source, f, compile(source, f)));
  const { url, openError } = await startPreview(dir, artifact.path);
  return {
    ok: true,
    url,
    path: artifact.path,
    form,
    bytes: artifact.bytes,
    ...(openError ? { note: `compiled and served, but could not auto-open a browser: ${openError}` } : {}),
  };
}
