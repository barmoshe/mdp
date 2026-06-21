// present.mjs: a minimal LOOPBACK static server + cross-platform "open in the
// default app", mirroring how packages/core/build.mjs spawns the OS opener.
//
// Rules: bind 127.0.0.1 only (never 0.0.0.0); port 0 so the OS hands us a free
// port; serve only files inside the root dir (reject path traversal); reuse one
// server per root dir; clean up on exit; all logging to stderr.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, join, normalize, basename, sep } from "node:path";
import { spawn } from "node:child_process";

const servers = new Map(); // absolute rootDir -> { server, port }

function log(msg) {
  process.stderr.write(`[mdp-mcp] ${msg}\n`);
}

// Start (or reuse) a loopback static server rooted at rootDir, then open
// filePath in the default browser. Returns { url, openError }.
export async function startPreview(rootDir, filePath) {
  const root = resolve(rootDir);
  const file = basename(filePath); // expose by basename within root only
  const port = await ensureServer(root);
  const url = `http://127.0.0.1:${port}/${encodeURIComponent(file)}`;
  const openError = await openInBrowser(url);
  log(`preview: ${url}`);
  return { url, openError: openError || null };
}

async function ensureServer(root) {
  const existing = servers.get(root);
  if (existing) return existing.port;

  const server = createServer(async (req, res) => {
    try {
      const reqPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const target = normalize(join(root, reqPath === "/" ? "/index.html" : reqPath));
      if (target !== root && !target.startsWith(root + sep)) {
        res.writeHead(403);
        res.end("forbidden");
        return;
      }
      const body = await readFile(target);
      res.writeHead(200, { "content-type": guessType(target), "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });

  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok); // loopback-only, ephemeral free port
  });
  const { port } = server.address();
  servers.set(root, { server, port });
  log(`serving ${root} on 127.0.0.1:${port}`);
  return port;
}

// Cross-platform default-app open, the same pattern build.mjs uses. Reports a
// failure instead of throwing (the artifact is already on disk + served).
function openInBrowser(url) {
  return new Promise((resolveOpen) => {
    if (process.env.MDP_NO_OPEN) return resolveOpen(null); // headless / tests: serve without opening a browser
    const platform = process.platform;
    const cmd = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
    const args = platform === "win32" ? ["/c", "start", "", url] : [url];
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", (e) => resolveOpen(e.message));
    child.on("spawn", () => {
      child.unref();
      resolveOpen(null);
    });
  });
}

function guessType(p) {
  if (p.endsWith(".html")) return "text/html; charset=utf-8";
  if (p.endsWith(".css")) return "text/css; charset=utf-8";
  if (p.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}

// Close every preview server on shutdown so a long-lived stdio process never
// leaks ports.
function shutdown() {
  for (const { server } of servers.values()) {
    try {
      server.close();
    } catch {}
  }
  servers.clear();
}
process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

// Exposed for tests/diagnostics: how many preview servers are currently open.
export function previewServerCount() {
  return servers.size;
}
