import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, ".env") });

const BUILD_PATH = "./build/server/index.js";
const DEVELOPMENT = process.env.NODE_ENV !== "production";

// Derive the port from NEXT_PUBLIC_SPACE_BASE_URL when available, otherwise
// default to http://localhost:3002 and fall back to PORT env if explicitly set.
const DEFAULT_BASE_URL = "http://localhost:3002";
const SPACE_BASE_URL = process.env.NEXT_PUBLIC_SPACE_BASE_URL || DEFAULT_BASE_URL;
let parsedBaseUrl;
try {
  parsedBaseUrl = new URL(SPACE_BASE_URL);
} catch {
  parsedBaseUrl = new URL(DEFAULT_BASE_URL);
}

const PORT = Number.parseInt(parsedBaseUrl.port, 10);

async function start() {
  const app = express();

  app.use(compression());
  app.disable("x-powered-by");

  if (DEVELOPMENT) {
    console.log("Starting development server");

    const vite = await import("vite").then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
        appType: "custom",
      })
    );

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      try {
        const source = await vite.ssrLoadModule("./server/app.ts");
        return source.app(req, res, next);
      } catch (error) {
        if (error instanceof Error) {
          vite.ssrFixStacktrace(error);
        }

        next(error);
      }
    });
  } else {
    console.log("Starting production server");

    app.use("/assets", express.static("build/client/assets", { immutable: true, maxAge: "1y" }));
    app.use(morgan("tiny"));
    app.use(express.static("build/client", { maxAge: "1h" }));
    app.use(await import(BUILD_PATH).then((mod) => mod.app));
  }

  app.listen(PORT, () => {
    const origin = `${parsedBaseUrl.protocol}//${parsedBaseUrl.hostname}:${PORT}`;
    console.log(`Server is running on ${origin}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
