// naming.mjs: turn a raw extension name + type into the full identifier set the
// templates need. Pure: no I/O, no clock, no randomness, deterministic. This is
// the unit-tested core of the scaffolder, kept separate so the rules can be
// proven without touching the filesystem.

const TYPES = ["block", "artifact"];

// Slugify to kebab-case: split camelCase boundaries, turn spaces/underscores and
// any other separators into "-", collapse repeats, trim, lowercase.
function slugify(raw) {
  return String(raw)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function toPascal(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

function toUpperSnake(slug) {
  return slug.replace(/-/g, "_").toUpperCase();
}

// Derive every identifier the templates substitute. Throws (with a readable
// message) on an unusable name, an unknown type, a name/type prefix mismatch, or
// an invalid npm scope. Never returns a partial result.
export function deriveNames({ rawName, type = "block", scope = "" } = {}) {
  if (!TYPES.includes(type)) {
    throw new Error(`Unknown type "${type}". Use one of: ${TYPES.join(", ")}.`);
  }
  if (rawName == null || String(rawName).trim() === "") {
    throw new Error("An extension name is required.");
  }

  let name = String(rawName).trim();

  // A scope baked into the name itself (e.g. "@acme/mdp-block-foo").
  let nameScope = "";
  const scopeMatch = name.match(/^(@[^/]+)\/(.*)$/);
  if (scopeMatch) {
    nameScope = scopeMatch[1];
    name = scopeMatch[2];
  }

  // Strip a leading mdp-block-/mdp-artifact- prefix; if present it must agree
  // with --type so "mdp-artifact-x --type block" is a loud error, not a silent
  // mismatch.
  const prefixMatch = name.match(/^mdp-(block|artifact)-(.*)$/i);
  if (prefixMatch) {
    const declared = prefixMatch[1].toLowerCase();
    if (declared !== type) {
      throw new Error(
        `Name "${rawName}" declares "${declared}" but --type is "${type}". Make them match.`
      );
    }
    name = prefixMatch[2];
  }

  const slug = slugify(name);
  if (!slug) {
    throw new Error(`"${rawName}" has no usable name after the prefix.`);
  }
  // First char must be a letter: the slug also seeds a CONST (FOO_STYLE) and a
  // PascalCase function name, neither of which may start with a digit.
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
    throw new Error(
      `"${slug}" is not a valid name part: start with a lowercase letter, then a-z, 0-9, or "-".`
    );
  }

  // Resolve the scope: the explicit --scope wins, else any scope in the name.
  let resolvedScope = (scope || nameScope || "").trim();
  if (resolvedScope && !resolvedScope.startsWith("@")) {
    resolvedScope = "@" + resolvedScope;
  }
  if (resolvedScope && !/^@[a-z0-9-~][a-z0-9-._~]*$/.test(resolvedScope)) {
    throw new Error(`"${resolvedScope}" is not a valid npm scope.`);
  }

  const bare = `mdp-${type}-${slug}`;
  const Pascal = toPascal(slug);

  return {
    type,
    slug,
    scope: resolvedScope,
    packageName: resolvedScope ? `${resolvedScope}/${bare}` : bare,
    dirName: bare,
    Pascal,
    renderFn: `render${Pascal}`,
    styleConst: `${toUpperSnake(slug)}_STYLE`,
    cssClass: `mdp-${slug}`,
    nodeType: slug,
    fence: `mdp:${slug}`,
    keyword: `mdp-${type}`,
  };
}

export { TYPES };
