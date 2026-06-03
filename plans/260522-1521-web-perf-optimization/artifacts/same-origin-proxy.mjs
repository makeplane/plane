// Minimal same-origin proxy for prod benchmark.
// Forwards /api/* and /auth/* to Django (8000); serves apps/web/build/client/ static with SPA fallback.
import http from "http";
import fs from "fs";
import path from "path";

const PORT = 3100;
const ROOT = "/Users/ngoctran/Documents/Shinhan/plane/apps/web/build/client";
const BACKEND = { host: "127.0.0.1", port: 8000 };

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

function proxy(req, res) {
  const headers = { ...req.headers };
  headers.host = `${BACKEND.host}:${BACKEND.port}`;
  const opts = { host: BACKEND.host, port: BACKEND.port, path: req.url, method: req.method, headers };
  const p = http.request(opts, (pres) => {
    res.writeHead(pres.statusCode, pres.headers);
    pres.pipe(res);
  });
  p.on("error", (e) => {
    console.error("[proxy-err]", req.url, e.message);
    if (!res.headersSent) res.writeHead(502);
    res.end(String(e));
  });
  req.pipe(p);
}

function serveStatic(req, res) {
  const url = req.url.split("?")[0];
  let filepath = path.join(ROOT, url === "/" ? "index.html" : url);
  try {
    if (!fs.existsSync(filepath) || fs.statSync(filepath).isDirectory()) {
      filepath = path.join(ROOT, "index.html");
    }
  } catch {
    filepath = path.join(ROOT, "index.html");
  }
  const ext = path.extname(filepath);
  const ct = MIME[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": ct,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
  });
  fs.createReadStream(filepath).pipe(res);
}

http
  .createServer((req, res) => {
    const u = req.url || "/";
    if (u.startsWith("/api/") || u.startsWith("/auth/")) return proxy(req, res);
    serveStatic(req, res);
  })
  .listen(PORT, () => console.log(`same-origin proxy on :${PORT} -> backend :${BACKEND.port}, static ${ROOT}`));
