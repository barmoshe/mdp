// test-server.mjs: a real MCP round-trip over stdio using the SDK Client. Spawns
// bin/mdp-mcp.mjs, lists tools + resources, calls mdp_validate, reads the spec and
// an example resource. Requires `npm install`. Sets MDP_NO_OPEN so the server can
// never open a browser. Run: node test-server.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
let failures = 0;
const check = (n, c) => {
  console.log((c ? "  ok   " : "  FAIL ") + n);
  if (!c) failures++;
};

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(here, "bin", "mdp-mcp.mjs")],
  env: { ...process.env, MDP_NO_OPEN: "1" },
  stderr: "inherit",
});
const client = new Client({ name: "mdp-mcp-test", version: "0.0.0" });
await client.connect(transport);

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
check(
  "tools = mdp_compile / mdp_present / mdp_validate",
  JSON.stringify(tools) === JSON.stringify(["mdp_compile", "mdp_present", "mdp_validate"])
);

const resources = (await client.listResources()).resources.map((r) => r.uri);
check("spec resource listed", resources.includes("mdp://spec"));

const v = await client.callTool({
  name: "mdp_validate",
  arguments: { source: "---\nmdp: 1\ntitle: X\n---\n# X\n{.lead} y\n" },
});
const vobj = JSON.parse(v.content[0].text);
check("mdp_validate over MCP: ok + counts", vobj.ok === true && vobj.blocks.title === 1);

const spec = await client.readResource({ uri: "mdp://spec" });
check("read mdp://spec", spec.contents[0].text.includes("MDP"));

const ex = await client.readResource({ uri: "mdp://example/comparison" });
check("read mdp://example/comparison", ex.contents[0].text.includes("mdp:"));

await client.close();
console.log(failures === 0 ? "\nmdp-mcp server round-trip: PASS" : `\nmdp-mcp server round-trip: ${failures} FAIL`);
process.exit(failures === 0 ? 0 : 1);
