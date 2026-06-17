// Minimale, dependency-vrije static server voor het Quorima-dashboard.
// Bindt op 127.0.0.1 (alleen lokaal) — Cloudflare Tunnel verbindt hier lokaal
// mee, dus er hoeven geen poorten open en er is geen reverse proxy nodig.
//
// Serveert ALLEEN de dashboard/-map (niet de repo-root → geen .env-lek).
// Hermes/Freya schrijft de live feed naar dashboard/data/invoice-overview.json.
//
// Start:  DASH_PORT=8787 node deploy/serve-dashboard.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, normalize, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
  process.env.DASH_DIR ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", "dashboard"),
);
const PORT = Number(process.env.DASH_PORT ?? 8787);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/") p = "/index.html";
    const full = normalize(join(ROOT, p));
    if (full !== ROOT && !full.startsWith(ROOT + "/")) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const body = await readFile(full);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(full)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Quorima dashboard op http://127.0.0.1:${PORT} (root: ${ROOT})`);
});
