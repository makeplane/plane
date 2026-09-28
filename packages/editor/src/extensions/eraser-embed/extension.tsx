/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { API_BASE_URL } from "@plane/constants";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { isEraserUrl } from "./url";

function currentWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname.split("/").find(Boolean) ?? "";
}

function EraserEmbedView({ node, updateAttributes, editor }: NodeViewProps) {
  const url = node.attrs.url as string;
  const workspaceSlug = currentWorkspaceSlug();
  const validUrl = isEraserUrl(url);
  const [draftUrl, setDraftUrl] = useState(url);
  const [embedUrl, setEmbedUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!validUrl || !workspaceSlug) return;
    setEmbedUrl("");
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL.replace(/\/$/, "")}/api/workspaces/${encodeURIComponent(workspaceSlug)}/eraser/embed/`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          }
        );
        if (!response.ok) throw new Error("The diagram is unavailable. Check the Eraser connection and file access.");
        const data = (await response.json()) as { embed_url: string };
        if (active) {
          setEmbedUrl(data.embed_url);
          setError("");
          timer = setTimeout(refresh, 14 * 60 * 1000);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "The diagram is unavailable.");
      }
    };
    void refresh();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [url, workspaceSlug, validUrl]);

  const saveUrl = () => {
    const nextUrl = draftUrl.trim();
    if (!isEraserUrl(nextUrl)) {
      setError("Enter a valid Eraser file or diagram URL.");
      return;
    }
    updateAttributes({ url: nextUrl });
    setError("");
  };

  return (
    <NodeViewWrapper className="my-3 rounded border border-subtle bg-surface-1 p-3">
      {validUrl ? (
        <>
          {embedUrl && (
            // Eraser's hosted embed needs its own origin to load its API content.
            // oxlint-disable-next-line eslint-plugin-react/iframe-missing-sandbox
            <iframe
              src={embedUrl}
              title="Eraser diagram"
              className="h-[420px] w-full border-0"
              referrerPolicy="no-referrer"
            />
          )}
          {error && <p className="text-body-xs-regular text-secondary">{error}</p>}
          {!embedUrl && !error && <p className="text-body-xs-regular text-secondary">Loading diagram...</p>}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-body-xs-medium text-primary">
            Open in Eraser
          </a>
        </>
      ) : editor.isEditable ? (
        <div className="flex gap-2">
          <input
            aria-label="Eraser file or diagram URL"
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                saveUrl();
              }
            }}
            placeholder="https://app.eraser.io/workspace/..."
            className="min-w-0 flex-1 rounded border border-subtle bg-surface-1 px-2 py-1"
          />
          <button type="button" onClick={saveUrl} className="bg-primary rounded px-3 py-1 text-white">
            Embed
          </button>
        </div>
      ) : (
        <p className="text-body-xs-regular text-secondary">Invalid Eraser link.</p>
      )}
      {!validUrl && error && <p className="mt-2 text-body-xs-regular text-secondary">{error}</p>}
    </NodeViewWrapper>
  );
}

export const EraserEmbedExtension = Node.create({
  name: CORE_EXTENSIONS.ERASER_EMBED,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return { url: { default: "" } };
  },

  parseHTML() {
    return [{ tag: "eraser-embed" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const url = node.attrs.url as string;
    return isEraserUrl(url)
      ? ["eraser-embed", mergeAttributes(HTMLAttributes), ["a", { href: url }, "Open in Eraser"]]
      : ["eraser-embed", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EraserEmbedView);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("eraser-link-paste"),
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData("text/plain")?.trim();
            if (!text || !isEraserUrl(text)) return false;
            this.editor.commands.insertContent({
              type: CORE_EXTENSIONS.ERASER_EMBED,
              attrs: { url: text },
            });
            return true;
          },
        },
      }),
    ];
  },
});
