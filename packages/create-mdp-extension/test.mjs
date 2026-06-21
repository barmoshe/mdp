// test.mjs: the scaffolder's own smoke test. Proves the pure core (name
// derivation + token substitution) without touching the filesystem. The
// end-to-end "the generated package actually works" guarantee lives in the
// repo's scripts/check-scaffold.mjs. Run with `node test.mjs`; exits non-zero on
// the first failure (the convention used by packages/mcp/test.mjs).

import assert from "node:assert/strict";
import { deriveNames } from "./src/naming.mjs";
import { substitute } from "./src/scaffold.mjs";

let passed = 0;
function check(label, fn) {
  fn();
  passed++;
  process.stdout.write(`  ok  ${label}\n`);
}

check("block: a plain name derives every identifier", () => {
  const n = deriveNames({ rawName: "foo", type: "block" });
  assert.equal(n.packageName, "mdp-block-foo");
  assert.equal(n.renderFn, "renderFoo");
  assert.equal(n.styleConst, "FOO_STYLE");
  assert.equal(n.cssClass, "mdp-foo");
  assert.equal(n.nodeType, "foo");
  assert.equal(n.fence, "mdp:foo");
  assert.equal(n.keyword, "mdp-block");
});

check("block: spaces and camelCase slugify to kebab-case", () => {
  const a = deriveNames({ rawName: "Tag List", type: "block" });
  assert.equal(a.slug, "tag-list");
  assert.equal(a.packageName, "mdp-block-tag-list");
  assert.equal(a.renderFn, "renderTagList");
  assert.equal(a.styleConst, "TAG_LIST_STYLE");
  const b = deriveNames({ rawName: "tagList", type: "block" });
  assert.equal(b.slug, "tag-list");
});

check("an existing prefix is stripped and re-applied, not doubled", () => {
  const n = deriveNames({ rawName: "mdp-block-foo", type: "block" });
  assert.equal(n.packageName, "mdp-block-foo");
});

check("a scope in the name is preserved", () => {
  const n = deriveNames({ rawName: "@acme/mdp-block-foo", type: "block" });
  assert.equal(n.scope, "@acme");
  assert.equal(n.packageName, "@acme/mdp-block-foo");
});

check("--scope is applied when the name has none", () => {
  const n = deriveNames({ rawName: "foo", type: "block", scope: "acme" });
  assert.equal(n.packageName, "@acme/mdp-block-foo");
});

check("artifact: derives renderCard + CARD_STYLE", () => {
  const n = deriveNames({ rawName: "card", type: "artifact" });
  assert.equal(n.packageName, "mdp-artifact-card");
  assert.equal(n.renderFn, "renderCard");
  assert.equal(n.styleConst, "CARD_STYLE");
  assert.equal(n.keyword, "mdp-artifact");
});

check("a name/type prefix mismatch throws", () => {
  assert.throws(() => deriveNames({ rawName: "mdp-artifact-x", type: "block" }), /match/i);
});

check("a leading-digit name throws (would break the CONST/fn identifiers)", () => {
  assert.throws(() => deriveNames({ rawName: "1abc", type: "block" }), /valid name/i);
});

check("an empty name throws", () => {
  assert.throws(() => deriveNames({ rawName: "   ", type: "block" }), /required|usable/i);
});

check("an unknown type throws", () => {
  assert.throws(() => deriveNames({ rawName: "foo", type: "widget" }), /Unknown type/);
});

check("substitute replaces every token and leaves no placeholder behind", () => {
  const tokens = [
    ["__PACKAGE_NAME__", "mdp-block-foo"],
    ["__RENDER_FN__", "renderFoo"],
    ["__STYLE_CONST__", "FOO_STYLE"],
  ];
  const out = substitute(
    "name __PACKAGE_NAME__ fn __RENDER_FN__ const __STYLE_CONST__",
    tokens
  );
  assert.equal(out, "name mdp-block-foo fn renderFoo const FOO_STYLE");
  assert.ok(!out.includes("__"), "no placeholder should remain");
});

check("substitute is deterministic across two calls", () => {
  const tokens = [["__A__", "1"]];
  assert.equal(substitute("__A__ __A__", tokens), substitute("__A__ __A__", tokens));
});

process.stdout.write(`\n${passed} checks passed.\n`);
