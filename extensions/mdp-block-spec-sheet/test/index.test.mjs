// Tests for mdp-block-spec-sheet. Zero-dep: node:test + node:assert. `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSpecSheet, parseSpecSheet, SPEC_SHEET_STYLE } from "../src/index.mjs";

const FENCE = `title: Tidewater 12
Display: 6.1 inch OLED
Weight: 184 g
Notes: ships with <b>x</b>`;

test("parseSpecSheet extracts the title and the rows", () => {
  const ir = parseSpecSheet(FENCE);
  assert.equal(ir.type, "spec-sheet");
  assert.equal(ir.title, "Tidewater 12");
  assert.equal(ir.rows.length, 3);
  assert.deepEqual(ir.rows[0], { key: "Display", value: "6.1 inch OLED" });
});

test("renders a definition list with one dt/dd per row", () => {
  const html = renderSpecSheet(parseSpecSheet(FENCE));
  assert.match(html, /class="mdp-spec-sheet"/);
  assert.match(html, /class="mdp-spec-sheet-title"/);
  assert.equal((html.match(/<dt /g) || []).length, 3);
  assert.equal((html.match(/<dd /g) || []).length, 3);
});

test("escapes author content (no raw HTML leaks through)", () => {
  const html = renderSpecSheet(parseSpecSheet(FENCE));
  assert.ok(!html.includes("<b>x</b>"), "raw markup must not survive");
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
});

test("a title-less sheet omits the title element", () => {
  const ir = parseSpecSheet("Display: 6.1 inch\nWeight: 184 g");
  assert.equal(ir.title, undefined);
  assert.ok(!renderSpecSheet(ir).includes("mdp-spec-sheet-title"));
});

test("STYLE holds the design lock (tokens only, logical properties)", () => {
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(SPEC_SHEET_STYLE), "no literal hex colors");
  assert.ok(
    !/\b(margin|padding|inset|border)-(left|right)\b/.test(SPEC_SHEET_STYLE),
    "no physical left/right properties"
  );
});

test("deterministic: identical output across two renders", () => {
  const ir = parseSpecSheet(FENCE);
  assert.equal(renderSpecSheet(ir), renderSpecSheet(ir));
});
