"use server";

import net from "node:net";

const DEFAULT_ALLOWED_HOSTS = ["drake.in", "localhost", "192.168.1.55", "127.0.0.1"];

const getAllowedHosts = () => {
  const raw = process.env.HLS_PROXY_ALLOWED_HOSTS;
  const envHosts = (raw ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase().replace(/\.$/, ""))
    .filter(Boolean);

  if (envHosts.includes("*")) return ["*"];

  // Always include default local/test hosts unless wildcard is used.
  return [...new Set([...DEFAULT_ALLOWED_HOSTS, ...envHosts])];
};

const isPrivateHostname = (hostname: string) => {
  if (hostname === "localhost") return true;
  const ipVersion = net.isIP(hostname);
  if (ipVersion === 4) {
    const [first, second] = hostname.split(".").map((part) => Number(part));
    if (first === 10) return true;
    if (first === 127) return true;
    if (first === 169 && second === 254) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 100 && second >= 64 && second <= 127) return true;
    return false;
  }
  if (ipVersion === 6) {
    const normalized = hostname.toLowerCase();
    return (
      normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")
    );
  }
  return false;
};

const isAllowedHost = (url: URL, allowedHosts: string[], requestHostname?: string | null) => {
  if (allowedHosts.includes("*")) return true;

  const normalizedUrlHost = url.hostname.toLowerCase().replace(/\.$/, "");
  const normalizedRequestHost = requestHostname?.toLowerCase().replace(/\.$/, "") ?? null;

  if (allowedHosts.length > 0) {
    const matchesAllowList = allowedHosts.some(
      (host) => normalizedUrlHost === host || normalizedUrlHost.endsWith(`.${host}`)
    );
    if (matchesAllowList) return true;
  }

  if (process.env.NODE_ENV !== "production") {
    if (normalizedRequestHost && normalizedUrlHost === normalizedRequestHost) return true;
    if (isPrivateHostname(normalizedUrlHost)) return true;
  }

  return false;
};

const toProxyUrl = (value: string, baseUrl: URL) => {
  let resolved: URL;
  try {
    resolved = new URL(value, baseUrl);
  } catch {
    return value;
  }
  return `/api/hls?url=${encodeURIComponent(resolved.toString())}`;
};

const rewritePlaylist = (playlist: string, baseUrl: URL) => {
  const lines = playlist.split(/\r?\n/);
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        if (!/uri=/i.test(trimmed)) return line;
        return line.replace(/URI=(?:"([^"]+)"|'([^']+)')/gi, (_match, doubleQuoted: string, singleQuoted: string) => {
          const uri = doubleQuoted || singleQuoted;
          return `URI="${toProxyUrl(uri, baseUrl)}"`;
        });
      }

      return toProxyUrl(trimmed, baseUrl);
    })
    .join("\n");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new Response("Missing url parameter.", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return new Response("Invalid url parameter.", { status: 400 });
  }

  // Preserve LL-HLS and cache-busting query params that video.js may append to the proxy URL.
  // Example: _HLS_msn, _HLS_part, _HLS_skip, etc.
  for (const [key, value] of searchParams.entries()) {
    if (key === "url") continue;
    targetUrl.searchParams.set(key, value);
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return new Response("Unsupported protocol.", { status: 400 });
  }

  const allowedHosts = getAllowedHosts();
  const requestHostname = request.headers.get("host")?.split(":")[0] ?? null;
  if (!isAllowedHost(targetUrl, allowedHosts, requestHostname)) {
    return new Response("Host not allowed.", { status: 403 });
  }

  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("range", range);
  const acceptHeader = request.headers.get("accept");
  if (acceptHeader) headers.set("accept", acceptHeader);
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);
  const referer = request.headers.get("referer");
  if (referer) headers.set("referer", referer);
  const origin = request.headers.get("origin");
  if (origin) headers.set("origin", origin);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) headers.set("x-api-key", apiKey);

  const upstream = await fetch(targetUrl, {
    headers,
    cache: "no-store",
    redirect: "follow",
  });

  const contentType = upstream.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  const normalizedContentType = contentType.toLowerCase();
  const normalizedAccept = accept.toLowerCase();
  const shouldInspectPlaylist =
    targetUrl.pathname.endsWith(".m3u8") ||
    targetUrl.pathname.endsWith("/file/") ||
    normalizedContentType.includes("application/vnd.apple.mpegurl") ||
    normalizedContentType.includes("application/x-mpegurl") ||
    normalizedAccept.includes("application/vnd.apple.mpegurl") ||
    normalizedAccept.includes("application/x-mpegurl");

  if (shouldInspectPlaylist) {
    const buffer = await upstream.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    const normalizedText = text.replace(/^\uFEFF/, "").trimStart();
    if (normalizedText.startsWith("#EXTM3U")) {
      const rewritten = rewritePlaylist(text, targetUrl);
      return new Response(rewritten, {
        status: upstream.status,
        headers: {
          "content-type": "application/x-mpegURL",
          "cache-control": "no-store",
        },
      });
    }

    return new Response(buffer, {
      status: upstream.status,
      headers: {
        "content-type": contentType || "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  }

  const passthroughHeaders = new Headers();
  const headerAllowlist = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "cache-control",
    "etag",
    "last-modified",
  ];
  headerAllowlist.forEach((key) => {
    const value = upstream.headers.get(key);
    if (value) passthroughHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: passthroughHeaders,
  });
}
