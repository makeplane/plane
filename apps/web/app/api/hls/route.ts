"use server";

import net from "node:net";

const getAllowedHosts = () => {
  const raw = process.env.HLS_PROXY_ALLOWED_HOSTS ?? "drake.in,localhost,192.168.1.55,127.0.0.1";
  return raw
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
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
  if (allowedHosts.length > 0) {
    const matchesAllowList = allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
    if (matchesAllowList) return true;
  }

  if (process.env.NODE_ENV !== "production") {
    if (requestHostname && url.hostname === requestHostname) return true;
    if (isPrivateHostname(url.hostname)) return true;
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
        if (!trimmed.includes("URI=\"")) return line;
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
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
  const shouldInspectPlaylist =
    targetUrl.pathname.endsWith(".m3u8") ||
    targetUrl.pathname.endsWith("/file/") ||
    contentType.includes("application/vnd.apple.mpegurl") ||
    accept.includes("application/vnd.apple.mpegurl") ||
    accept.includes("application/x-mpegURL");

  if (shouldInspectPlaylist) {
    const buffer = await upstream.arrayBuffer();
    const head = new TextDecoder().decode(buffer.slice(0, 7));
    if (head.startsWith("#EXTM3U")) {
      const text = new TextDecoder().decode(buffer);
      const rewritten = rewritePlaylist(text, targetUrl);
      return new Response(rewritten, {
        status: upstream.status,
        headers: {
          "content-type": "application/vnd.apple.mpegurl",
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
