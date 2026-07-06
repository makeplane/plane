/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  html: string;
};

// Incoming mail HTML is untrusted content authored by a third party: it may
// carry its own <style>/inline styles that would otherwise leak into (and
// break) the surrounding app layout if injected directly into the page DOM.
// Rendering it inside a sandboxed iframe keeps its styles and markup fully
// scoped. `allow-same-origin` (without `allow-scripts`) lets us read
// `contentDocument` to auto-size the frame while still guaranteeing that any
// <script>/event-handler markup that slipped past server-side sanitization
// cannot execute.
const frameDocument = (bodyHtml: string) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_blank" />
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        background: #ffffff;
        color: #1f1c18;
        font-family: "Hanken Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; border-collapse: collapse; }
      a { color: #c24e2c; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`;

export function MailHtmlFrame(props: Props) {
  const { html } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);

  const resize = () => {
    const body = iframeRef.current?.contentDocument?.body;
    if (body) setHeight(body.scrollHeight);
  };

  useEffect(() => {
    const body = iframeRef.current?.contentDocument?.body;
    if (!body || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resize);
    observer.observe(body);
    return () => observer.disconnect();
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="mail-message-body"
      srcDoc={frameDocument(html)}
      onLoad={resize}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="mail-message-frame mt-6 w-full max-w-4xl border-0"
      style={{ height }}
    />
  );
}
