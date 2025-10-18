import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import type { Express } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
  : "http://127.0.0.1:8000";
const NEXT_PUBLIC_API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH
  ? process.env.NEXT_PUBLIC_API_BASE_PATH.replace(/\/+$/, "")
  : "/api";
const NORMALIZED_API_BASE_PATH = NEXT_PUBLIC_API_BASE_PATH.startsWith("/")
  ? NEXT_PUBLIC_API_BASE_PATH
  : `/${NEXT_PUBLIC_API_BASE_PATH}`;
const NEXT_PUBLIC_ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH
  ? process.env.NEXT_PUBLIC_ADMIN_BASE_PATH.replace(/\/$/, "")
  : "/";

export const app: Express = express();

// Ensure proxy-aware hostname/URL handling (e.g., X-Forwarded-Host/Proto)
// so generated URLs/redirects reflect the public host when behind Nginx.
// See related fix in Remix Express adapter.
app.set("trust proxy", true);

app.use(
  "/api",
  createProxyMiddleware({
    target: NEXT_PUBLIC_API_BASE_URL,
    changeOrigin: true,
    secure: false,
    pathRewrite: (path: string) =>
      NORMALIZED_API_BASE_PATH === "/api" ? path : path.replace(/^\/api/, NORMALIZED_API_BASE_PATH),
  })
);

const router = express.Router();

router.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
  })
);

app.use(NEXT_PUBLIC_ADMIN_BASE_PATH, router);
