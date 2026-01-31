"use server";

const getAllowedHosts = () => {
  const raw = process.env.HLS_PROXY_ALLOWED_HOSTS ?? "drake.in,localhost,127.0.0.1";
  return raw
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
};

const isAllowedHost = (url: URL, allowedHosts: string[]) => {
  if (allowedHosts.length === 0) return false;
  return allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
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
  if (!isAllowedHost(targetUrl, allowedHosts)) {
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
