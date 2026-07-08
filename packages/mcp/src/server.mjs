// server.mjs: the MCP wiring. Registers three tools + the spec/example resources,
// connects the stdio transport, and routes ALL logging to stderr (stdout is the
// JSON-RPC channel; one stray write to stdout corrupts the stream). The tool
// logic lives in tools.mjs (pure); this file is thin glue, so SDK API churn
// touches only here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ARTIFACTS } from "./engine.mjs";
import { mdpCompile, mdpValidate, mdpPresent, mdpSendSlack } from "./tools.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(here, "..", "assets"); // vendored SPEC.md + examples/

function log(msg) {
  process.stderr.write(`[mdp-mcp] ${msg}\n`);
}

// Wrap a pure handler's structured result as MCP text content (JSON, so a host
// can show it and a model can parse it). Errors become isError content rather
// than thrown exceptions (better UX in hosts; the model sees the message).
function asText(obj) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}
async function run(fn, args) {
  try {
    return asText(await fn(args));
  } catch (err) {
    log(`tool error: ${err.message}`);
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
}

function readAsset(rel) {
  return readFileSync(join(assetsDir, rel), "utf8");
}

export async function startServer() {
  const server = new McpServer({ name: "mdp-mcp", version: "0.7.0" });

  // --- tools ---
  server.registerTool(
    "mdp_compile",
    {
      title: "Compile MDP",
      description:
        "Compile an MDP source string into design-locked HTML and write it to a file. " +
        "Returns the absolute output path(s) and byte size. No browser. Deterministic.",
      inputSchema: {
        source: z.string().describe("The raw .mdp source text."),
        form: z.enum([...ARTIFACTS, "all"]).default("page").describe('Which artifact to compile (any MDP form), or "all".'),
        out_dir: z.string().optional().describe("Output directory. Defaults to $MDP_OUT_DIR or the OS temp dir."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    (args) => run(mdpCompile, args)
  );

  server.registerTool(
    "mdp_validate",
    {
      title: "Validate MDP",
      description: "Parse an MDP source and report { ok, meta, blocks (type->count), issues }. Never throws.",
      inputSchema: { source: z.string().describe("The raw .mdp source text.") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    (args) => run(mdpValidate, args)
  );

  server.registerTool(
    "mdp_present",
    {
      title: "Present MDP",
      description:
        "Compile (default: slides), serve it on a loopback (127.0.0.1) preview server, open the " +
        "default browser, and return the URL and absolute path.",
      inputSchema: {
        source: z.string().describe("The raw .mdp source text."),
        form: z.enum([...ARTIFACTS]).default("slides").describe("Which artifact to present (any MDP form). Defaults to slides."),
        out_dir: z.string().optional().describe("Output directory. Defaults to $MDP_OUT_DIR or the OS temp dir."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    (args) => run(mdpPresent, args)
  );

  server.registerTool(
    "mdp_send_slack",
    {
      title: "Send MDP to Slack",
      description:
        "Compile an MDP source and upload the self-contained HTML artifact to a Slack channel as a file. " +
        "Any single form. Requires SLACK_BOT_TOKEN (a bot token with files:write); the channel is the " +
        "`channel` arg or $MDP_SLACK_CHANNEL. Note: Slack shows the .html as a downloadable file, not an " +
        "inline render — opening it shows the full design (interactive forms included).",
      inputSchema: {
        source: z.string().describe("The raw .mdp source text."),
        form: z.enum([...ARTIFACTS]).default("page").describe("Which artifact to send (any single MDP form)."),
        channel: z
          .string()
          .optional()
          .describe("Slack channel id (e.g. C0123456789). Defaults to $MDP_SLACK_CHANNEL. The bot must be a member of it."),
        initial_comment: z.string().optional().describe("Optional message shown above the uploaded file."),
        out_dir: z.string().optional().describe("Working dir for the compiled HTML. Defaults to $MDP_OUT_DIR or the OS temp dir."),
      },
      annotations: { readOnlyHint: false, openWorldHint: true }, // openWorld: reaches the Slack API
    },
    (args) => run(mdpSendSlack, args)
  );

  // --- resources ---
  // mdp://spec -> the vendored SPEC.md
  server.registerResource(
    "spec",
    "mdp://spec",
    { title: "MDP specification", description: "The MDP format specification.", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: readAsset("SPEC.md") }] })
  );

  // The vendored manifests list exactly what shipped (written by sync-mcp.mjs),
  // so the resource list + description never drift from the vendored files.
  const exMeta = JSON.parse(readAsset(join("examples", "manifest.json")));
  const tmplMeta = JSON.parse(readAsset(join("templates", "manifest.json")));

  // mdp://example/{name} -> a vendored example source. list + description derived.
  server.registerResource(
    "example",
    new ResourceTemplate("mdp://example/{name}", {
      list: () => ({
        resources: exMeta.map((e) => ({
          uri: `mdp://example/${e.id}`,
          name: e.id,
          title: e.label,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { title: "MDP example", description: `A complete example source (${exMeta.map((e) => e.id).join(" | ")}).`, mimeType: "text/markdown" },
    async (uri, { name }) => {
      const safe = String(name).replace(/[^a-z0-9_-]/gi, "");
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: readAsset(join("examples", `${safe}.mdp`)) }] };
    }
  );

  // mdp://template/{name} -> a vendored fill-in template source. list + description derived.
  server.registerResource(
    "template",
    new ResourceTemplate("mdp://template/{name}", {
      list: () => ({
        resources: tmplMeta.map((e) => ({
          uri: `mdp://template/${e.id}`,
          name: e.id,
          title: e.label,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { title: "MDP template", description: `A fill-in template source (${tmplMeta.map((e) => e.id).join(" | ")}).`, mimeType: "text/markdown" },
    async (uri, { name }) => {
      const safe = String(name).replace(/[^a-z0-9_-]/gi, "");
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: readAsset(join("templates", `${safe}.mdp`)) }] };
    }
  );

  await server.connect(new StdioServerTransport());
  log("ready on stdio");
}
