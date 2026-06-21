// check-logo.mjs: tests for the brand-logo masthead slot (ADR 0090).
//
// Asserts the v1 brand layer's guarantees against the real engine: a valid logo
// emits exactly one sanitized <img> in every form; unsafe / malformed values
// drop to no-logo and leave the masthead byte-identical to a no-logo render;
// non-string values are ignored; output is deterministic; and under dir=rtl the
// logo is the first masthead child with no physical left/right in its rule.
// Pure asserts, no dependencies. Run via `npm test` (after check-contrast).

import assert from "node:assert";
import { compile } from "../packages/core/src/index.mjs";

const FORMS = ["page", "slides", "flyer"];
const IMG = /<img class="mdp-logo"[^>]*>/g;

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`ok   - ${name}`);
  } catch (e) {
    fail++;
    console.error(`FAIL - ${name}: ${e.message}`);
  }
}

// A minimal source; `logoLine` is "" or a full `brand-logo: ...\n` line.
const src = (logoLine) =>
  `---\nmdp: 1\nforms: [page, slides, flyer]\ntitle: Acme\n${logoLine}---\n\n# Acme\n{.lead} A branded brief.\n\n## Section\nBody text.\n`;

const VALID_PATH = "brand-logo: ./assets/acme.svg\n";
const VALID_DATA = "brand-logo: data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=\n";

check("valid path emits exactly one logo <img> in every form", () => {
  for (const f of FORMS) {
    const html = compile(src(VALID_PATH), f);
    assert.equal((html.match(IMG) || []).length, 1, `${f}: img count`);
    assert.ok(html.includes('src="./assets/acme.svg"'), `${f}: src present`);
  }
});

check("base64 data: image emits exactly one logo <img> in every form", () => {
  for (const f of FORMS) {
    assert.equal((compile(src(VALID_DATA), f).match(IMG) || []).length, 1, f);
  }
});

const UNSAFE = [
  ["javascript:", "brand-logo: javascript:alert(1)\n"],
  ["data:text/html", "brand-logo: data:text/html,<b>x</b>\n"],
  ["raw (non-base64) svg data:", "brand-logo: data:image/svg+xml,<svg onload=alert(1)></svg>\n"],
];
for (const [label, bad] of UNSAFE) {
  check(`unsafe value (${label}) drops to no-logo, masthead == no-logo render`, () => {
    for (const f of FORMS) {
      const withBad = compile(src(bad), f);
      const noLogo = compile(src(""), f);
      assert.equal((withBad.match(IMG) || []).length, 0, `${f}: expected no img`);
      assert.equal(withBad, noLogo, `${f}: output must equal the no-logo render`);
    }
  });
}

check("non-string brand-logo (array / number) is ignored", () => {
  for (const v of ["brand-logo: [a, b]\n", "brand-logo: 123\n"]) {
    for (const f of FORMS) {
      assert.equal((compile(src(v), f).match(IMG) || []).length, 0, `${f}: ${v.trim()}`);
    }
  }
});

check("deterministic: two compiles are byte-identical", () => {
  for (const f of FORMS) {
    assert.equal(compile(src(VALID_PATH), f), compile(src(VALID_PATH), f), f);
  }
});

check("rtl: logo is the first masthead child; .mdp-logo uses logical props only", () => {
  const html = compile(
    `---\nmdp: 1\nlang: he\ndir: rtl\nforms: [page]\ntitle: brand\nbrand-logo: ./m.svg\n---\n\n# brand\n`,
    "page"
  );
  const iImg = html.indexOf('class="mdp-logo"');
  const iEyebrow = html.indexOf('class="mdp-eyebrow"');
  assert.ok(iImg > -1 && iImg < iEyebrow, "logo <img> precedes the eyebrow");
  const rule = (html.match(/\.mdp-logo\s*\{[^}]*\}/) || [""])[0];
  assert.ok(!/\b(left|right)\b/.test(rule), `.mdp-logo must avoid physical left/right: ${rule}`);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
