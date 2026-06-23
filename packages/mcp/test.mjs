// test.mjs: a standalone smoke test, no test runner (matches the repo's
// "tests = small node scripts" convention, like scripts/check-contrast.mjs).
// It imports the PURE handlers from src/tools.mjs (no stdio, no SDK) and asserts
// compile output, validate behaviour, and determinism. Exits non-zero on the
// first failure so CI fails loudly. Run: node test.mjs (after `npm run sync:mcp`).
import { readFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mdpCompile, mdpValidate, mdpPresent, mdpSendSlack } from "./src/tools.mjs";
import { artifactFilename } from "./src/io.mjs";
import { ARTIFACTS } from "./src/engine.mjs";
import { slackApi, uploadFileToSlack } from "./src/slack.mjs";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "assets");

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`  ok   ${name}`);
  else {
    console.error(`  FAIL ${name}`);
    failures++;
  }
}

// Per-form stable markers, verified against packages/core/src renderers.
const MARKERS = {
  page: ['<main class="mdp-page">', "mdp-page-masthead"],
  slides: ["mdp-deck", '<section class="mdp-slide'],
  flyer: ["mdp-flyer", "mdp-flyer-band"],
  report: ['<article class="mdp-report">', "mdp-report-cover"],
  onepager: ['<article class="mdp-onepager">', "mdp-onepager-header"],
  memo: ['<article class="mdp-memo">', "mdp-memo-meta"],
  letter: ['<article class="mdp-letter">', "mdp-letter-body"],
  scroll: ['<div class="mdp-scroll">', "mdp-scene-hero"],
  accordion: ['<main class="mdp-accordion">', "mdp-acc-item"],
  tabs: ['<main class="mdp-tabs">', "mdp-tablist"],
  stepper: ['<main class="mdp-stepper">', "mdp-step-rail"],
};

const GOOD = `---
mdp: 1
theme: studio
title: Smoke Test
---

# Smoke Test
{.lead} A tiny source that exercises every form.

---

## Numbers
\`\`\`mdp:stats
Revenue: $1.2M
Users: 48k
\`\`\`
`;

// Unknown container + no title: parse() must degrade (not throw), validate must
// surface issues.
const MALFORMED = `:::mystery
text the parser does not recognise as a known directive
:::
`;

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "mdp-mcp-test-"));

  // 1. compile all forms: file written, markers present, stats value rendered.
  const all = await mdpCompile({ source: GOOD, form: "all", out_dir: dir });
  check(`compile all -> ${ARTIFACTS.length} artifacts`, all.artifacts.length === ARTIFACTS.length);
  for (const art of all.artifacts) {
    const html = readFileSync(art.path, "utf8");
    check(`${art.form}: file has bytes`, art.bytes > 0 && Buffer.byteLength(html, "utf8") === art.bytes);
    check(`${art.form}: generator meta`, html.includes('<meta name="generator" content="MDP">'));
    for (const m of MARKERS[art.form]) check(`${art.form}: contains ${m}`, html.includes(m));
    check(`${art.form}: stats rendered`, html.includes("48k"));
  }

  // 1b. brand-logo: a safe value renders exactly one masthead <img> in each form;
  // an unsafe value drops to no logo (ADR 0090).
  const BRANDED = GOOD.replace("title: Smoke Test\n", "title: Smoke Test\nbrand-logo: ./logo.svg\n");
  const branded = await mdpCompile({ source: BRANDED, form: "all", out_dir: dir });
  for (const art of branded.artifacts) {
    const html = readFileSync(art.path, "utf8");
    check(`${art.form}: brand-logo renders one masthead img`, (html.match(/<img class="mdp-logo"/g) || []).length === 1);
  }
  const UNSAFE = GOOD.replace("title: Smoke Test\n", "title: Smoke Test\nbrand-logo: javascript:alert(1)\n");
  const unsafe = await mdpCompile({ source: UNSAFE, form: "page", out_dir: dir });
  check("brand-logo: unsafe value drops to no logo", !readFileSync(unsafe.artifacts[0].path, "utf8").includes('<img class="mdp-logo"'));

  // 2a. validate good source.
  const ok = await mdpValidate({ source: GOOD });
  check("validate good: ok=true", ok.ok === true);
  check("validate good: counts title", ok.blocks.title === 1);
  check("validate good: counts stats", ok.blocks.stats === 1);
  check("validate good: no issues", ok.issues.length === 0);

  // 2b. validate malformed: never throws, reports issues.
  const bad = await mdpValidate({ source: MALFORMED });
  check("validate malformed: ok=false", bad.ok === false);
  check("validate malformed: has issues", bad.issues.length > 0);
  check("validate malformed: returned an object (did not throw)", typeof bad === "object");

  // 3. determinism: source-hash filename + identical bytes across out_dirs.
  const a = await mdpCompile({ source: GOOD, form: "page", out_dir: dir });
  const b = await mdpCompile({ source: GOOD, form: "page", out_dir: join(dir, "second") });
  check("determinism: filename is source-hash", a.artifacts[0].path.endsWith(artifactFilename(GOOD, "page")));
  check("determinism: same bytes across dirs", a.artifacts[0].bytes === b.artifacts[0].bytes);
  check(
    "determinism: identical HTML",
    readFileSync(a.artifacts[0].path, "utf8") === readFileSync(b.artifacts[0].path, "utf8")
  );

  // 3b. vendored manifests resolve (written by sync-mcp): for examples and
  // templates, the manifest id-set equals the vendored file-set and every id
  // maps to a non-empty .mdp. This is what the server's resource list derives from.
  for (const kind of ["examples", "templates"]) {
    const man = JSON.parse(readFileSync(join(ASSETS, kind, "manifest.json"), "utf8"));
    const files = readdirSync(join(ASSETS, kind)).filter((f) => f.endsWith(".mdp")).sort();
    const ids = man.map((e) => e.file).sort();
    check(`${kind}: manifest id-set == vendored file-set`, JSON.stringify(files) === JSON.stringify(ids));
    let allResolve = man.length > 0;
    for (const e of man) {
      if (!readFileSync(join(ASSETS, kind, `${e.id}.mdp`), "utf8").trim()) allResolve = false;
    }
    check(`${kind}: every manifest id resolves to non-empty bytes`, allResolve);
  }

  // 4. present (opt-in via MDP_TEST_PRESENT; never opens a browser): loopback serve + fetch.
  if (process.env.MDP_TEST_PRESENT) {
    process.env.MDP_NO_OPEN = "1";
    const { previewServerCount } = await import("./src/present.mjs");
    const pres = await mdpPresent({ source: GOOD, form: "slides", out_dir: dir });
    check("present: 127.0.0.1 url", /^http:\/\/127\.0\.0\.1:\d+\//.test(pres.url || ""));
    const resp = await fetch(pres.url);
    const body = await resp.text();
    check("present: serves 200", resp.status === 200);
    check("present: served the slides html", body.includes("mdp-deck"));
    check("present: a server is open", previewServerCount() >= 1);
  }

  // 5. slack: refusal paths are pure (always run); the 3-step upload flow runs
  // against a STUBBED global fetch (no network). A real send is opt-in via
  // MDP_TEST_SLACK + SLACK_BOT_TOKEN so default CI never reaches the network.
  {
    const savedToken = process.env.SLACK_BOT_TOKEN;
    const savedChannel = process.env.MDP_SLACK_CHANNEL;
    const realFetch = globalThis.fetch;
    try {
      // 5a. no token -> structured refusal, not a throw.
      delete process.env.SLACK_BOT_TOKEN;
      const noTok = await mdpSendSlack({ source: GOOD, form: "page", channel: "C1" });
      check("slack: no token -> error no_token", noTok.ok === false && noTok.error === "no_token");

      // 5b. token present but no channel (arg or env) -> refusal.
      process.env.SLACK_BOT_TOKEN = "xoxb-test";
      delete process.env.MDP_SLACK_CHANNEL;
      const noChan = await mdpSendSlack({ source: GOOD, form: "page" });
      check("slack: no channel -> error no_channel", noChan.ok === false && noChan.error === "no_channel");

      // 5c. slackApi passes the { ok:false, error } envelope straight through.
      globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: false, error: "not_in_channel" }) });
      const envOut = await slackApi("files.completeUploadExternal", "xoxb-test", { foo: 1 });
      check("slack: slackApi passes Slack error through", envOut.ok === false && envOut.error === "not_in_channel");

      // 5d. full 3-step upload against a stubbed fetch: order + success shape.
      const calls = [];
      globalThis.fetch = async (url) => {
        const u = String(url);
        calls.push(u);
        if (u.includes("files.getUploadURLExternal"))
          return { ok: true, json: async () => ({ ok: true, upload_url: "https://files.slack.test/up", file_id: "F123" }) };
        if (u === "https://files.slack.test/up") return { ok: true, text: async () => "OK" };
        if (u.includes("files.completeUploadExternal"))
          return { ok: true, json: async () => ({ ok: true, files: [{ id: "F123", permalink: "https://slack.test/F123" }] }) };
        return { ok: false, status: 404, json: async () => ({ ok: false, error: "unexpected_url" }) };
      };
      const up = await uploadFileToSlack({ token: "xoxb-test", filePath: a.artifacts[0].path, filename: "page.html", channel: "C1", initialComment: "hi" });
      check("slack: upload ok with file id", up.ok === true && up.file_id === "F123");
      check("slack: upload returns permalink", !!(up.file && up.file.permalink === "https://slack.test/F123"));
      check(
        "slack: 3 calls in order (reserve, bytes, complete)",
        calls.length === 3 &&
          calls[0].includes("files.getUploadURLExternal") &&
          calls[1] === "https://files.slack.test/up" &&
          calls[2].includes("files.completeUploadExternal")
      );

      // 5e. a Slack error at step 1 surfaces as { ok:false, error } (no throw).
      globalThis.fetch = async (url) =>
        String(url).includes("files.getUploadURLExternal")
          ? { ok: true, json: async () => ({ ok: false, error: "invalid_auth" }) }
          : { ok: true, json: async () => ({ ok: true }) };
      const upErr = await uploadFileToSlack({ token: "x", filePath: a.artifacts[0].path, channel: "C1" });
      check("slack: step-1 error surfaces", upErr.ok === false && upErr.error === "invalid_auth");

      // 5f. opt-in LIVE send (real network) — only with MDP_TEST_SLACK + a real token.
      if (process.env.MDP_TEST_SLACK && savedToken) {
        globalThis.fetch = realFetch;
        process.env.SLACK_BOT_TOKEN = savedToken;
        const live = await mdpSendSlack({ source: GOOD, form: "page", channel: savedChannel, initial_comment: "mdp-mcp live smoke test" });
        check("slack: live send ok", live.ok === true);
        console.log(`  info live send -> ${JSON.stringify(live)}`);
      }
    } finally {
      globalThis.fetch = realFetch;
      if (savedToken === undefined) delete process.env.SLACK_BOT_TOKEN;
      else process.env.SLACK_BOT_TOKEN = savedToken;
      if (savedChannel === undefined) delete process.env.MDP_SLACK_CHANNEL;
      else process.env.MDP_SLACK_CHANNEL = savedChannel;
    }
  }

  console.log(failures === 0 ? "\nmdp-mcp smoke: PASS" : `\nmdp-mcp smoke: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
