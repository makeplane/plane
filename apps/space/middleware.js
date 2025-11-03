import { next } from "@vercel/edge";

export default function middleware() {
  return next({
    headers: {
      "Referrer-Policy": "origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "X-DNS-Prefetch-Control": "on",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    },
  });
}
