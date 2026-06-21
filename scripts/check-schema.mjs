// check-schema.mjs: the JSON Schema conformance gate (issue #4).
//
// Parses every example + template with the real engine and validates the
// resulting IR against the versioned schema exported from @mdp/core. This is
// what makes "the spec is a prompt" enforceable: if the parser starts emitting a
// block shape the schema doesn't allow (engine drift), or a source carries an
// off-grammar frontmatter key (example drift), CI fails here.
//
// The validator is a tiny, dependency-free reader of the draft-07 subset this
// schema actually uses (type/const/enum/required/properties/additionalProperties/
// items/oneOf/$ref/uniqueItems). Hand-rolled on purpose, like check-contrast.mjs:
// it keeps @mdp/core and the test suite zero-dependency. The schema is still a
// standard draft-07 document, so ajv or the browser validate it identically.
//
// Run: npm run check:schema   (also in `npm test` and CI)
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse, SCHEMA, SCHEMA_VERSION } from "../packages/core/src/index.mjs";

// ---- a minimal draft-07 validator (only the keywords SCHEMA uses) ----

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v; // "string" | "number" | "boolean" | "object"
}

function matchesType(v, t) {
  if (t === "integer") return Number.isInteger(v);
  if (t === "number") return typeof v === "number";
  if (t === "null") return v === null;
  if (t === "array") return Array.isArray(v);
  if (t === "object") return v !== null && typeof v === "object" && !Array.isArray(v);
  return typeof v === t;
}

// Resolve a local "#/definitions/x" reference against the root schema.
function resolveRef(ref, root) {
  const node = ref.replace(/^#\//, "").split("/").reduce((acc, key) => acc && acc[key], root);
  if (!node) throw new Error(`unresolved $ref ${ref}`);
  return node;
}

function validate(schema, value, root, path, errors) {
  if (schema.$ref) return validate(resolveRef(schema.$ref, root), value, root, path, errors);

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      errors.push(`${path}: expected type ${types.join("|")}, got ${typeOf(value)}`);
      return errors; // type is wrong; further keyword checks would be noise
    }
  }
  if ("const" in schema && value !== schema.const) {
    errors.push(`${path}: expected ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not in [${schema.enum.join(", ")}]`);
  }
  if (schema.oneOf) validateOneOf(schema.oneOf, value, root, path, errors);

  if (matchesType(value, "object")) {
    const props = schema.properties || {};
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${path}: missing required property "${key}"`);
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in value) validate(sub, value[key], root, `${path}.${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in props)) errors.push(`${path}: unexpected property "${key}"`);
      }
    }
  }

  if (matchesType(value, "array")) {
    if (schema.items) value.forEach((el, i) => validate(schema.items, el, root, `${path}[${i}]`, errors));
    if (schema.uniqueItems) {
      const seen = new Set();
      value.forEach((el, i) => {
        const k = JSON.stringify(el);
        if (seen.has(k)) errors.push(`${path}[${i}]: duplicate item ${k}`);
        seen.add(k);
      });
    }
  }
  return errors;
}

// oneOf, discriminator-aware: the block union is keyed by `type` (a const per
// branch). Validate only the matching branch so an error points at the real
// block ("blocks[3].items[0]: missing value") instead of "matched 0 of 11".
function validateOneOf(branches, value, root, path, errors) {
  if (value && typeof value === "object" && typeof value.type === "string") {
    for (const b of branches) {
      const resolved = b.$ref ? resolveRef(b.$ref, root) : b;
      if (resolved?.properties?.type?.const === value.type) {
        return validate(resolved, value, root, path, errors);
      }
    }
    errors.push(`${path}: unknown block type "${value.type}"`);
    return errors;
  }
  // Non-discriminated: exactly one branch must validate.
  const matches = branches.filter((b) => validate(b, value, root, path, []).length === 0);
  if (matches.length !== 1) {
    errors.push(`${path}: matched ${matches.length} of ${branches.length} schema branches (expected 1)`);
  }
  return errors;
}

// ---- run conformance over every shipped source ----

const root = dirname(dirname(fileURLToPath(import.meta.url)));
let failures = 0;
const fail = (m) => { console.error(`  FAIL ${m}`); failures++; };
const ok = (m) => console.log(`  ok   ${m}`);

// (a) the schema's block $refs all resolve (catches an authoring typo).
try {
  const refs = SCHEMA.properties.blocks.items.oneOf.map((b) => b.$ref).filter(Boolean);
  refs.forEach((r) => resolveRef(r, SCHEMA));
  ok(`schema v${SCHEMA_VERSION}: ${refs.length} block definitions resolve`);
} catch (e) {
  fail(`schema self-check: ${e.message}`);
}

// (b) every example + template parses to an IR that validates against the schema.
let count = 0;
for (const kind of ["examples", "templates"]) {
  const files = readdirSync(join(root, kind)).filter((f) => f.endsWith(".mdp")).sort();
  for (const file of files) {
    const ir = parse(readFileSync(join(root, kind, file), "utf8"));
    const errors = validate(SCHEMA, ir, SCHEMA, `${kind}/${file}`, []);
    if (errors.length) errors.forEach(fail);
    else { ok(`${kind}/${file}`); count++; }
  }
}
if (count) ok(`${count} sources conform to schema v${SCHEMA_VERSION}`);

console.log(failures === 0 ? "\ncheck-schema: PASS" : `\ncheck-schema: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
