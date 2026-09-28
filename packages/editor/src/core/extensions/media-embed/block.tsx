/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
// types
import { IMediaEmbedAttributeNames } from "./types";
import type { TMediaEmbedAttributes } from "./types";
import { isAllowedMediaOrigin, detectMediaType, extractVideoEmbedUrl } from "./types";

export type MediaEmbedNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TMediaEmbedAttributes;
  };
  updateAttributes: (attrs: Partial<TMediaEmbedAttributes>) => void;
};

export function MediaEmbedBlock(props: MediaEmbedNodeViewProps) {
  const { editor, node, updateAttributes } = props;
  const src = node.attrs[IMediaEmbedAttributeNames.SRC] ?? "";
  const mediaType = node.attrs[IMediaEmbedAttributeNames.MEDIA_TYPE] ?? "image";
  const alt = node.attrs[IMediaEmbedAttributeNames.ALT] ?? "";
  const caption = node.attrs[IMediaEmbedAttributeNames.CAPTION] ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpdateUrl = useCallback(
    (url: string) => {
      if (!url.trim()) {
        updateAttributes({ [IMediaEmbedAttributeNames.SRC]: "" });
        setError(null);
        return;
      }
      const detectedType = detectMediaType(url);
      if (!isAllowedMediaOrigin(url, detectedType)) {
        setError("URL from untrusted origin. Only allowlisted sources are permitted.");
        return;
      }
      setError(null);
      updateAttributes({
        [IMediaEmbedAttributeNames.SRC]: url,
        [IMediaEmbedAttributeNames.MEDIA_TYPE]: detectedType,
      });
    },
    [updateAttributes]
  );

  const renderMedia = () => {
    if (!src) {
      return <div className="text-xs text-custom-text-300 py-8 text-center">Enter a URL for the image or video</div>;
    }

    if (error) {
      return (
        <div className="bg-red-50 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded p-3">{error}</div>
      );
    }

    if (mediaType === "video") {
      const embedUrl = extractVideoEmbedUrl(src);
      if (embedUrl) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded video"
              sandbox="allow-scripts allow-popups allow-presentation"
            />
          </div>
        );
      }
      return (
        <video src={src} controls className="w-full rounded" preload="metadata" title={alt || "Embedded video"}>
          <track kind="captions" src="" label="No captions available" />
        </video>
      );
    }

    return (
      <img
        src={src}
        alt={alt || "Embedded image"}
        className="w-full rounded object-contain"
        loading="lazy"
        onError={() => setError("Failed to load image")}
      />
    );
  };

  return (
    <NodeViewWrapper
      className="editor-media-embed-block border-custom-border-200 my-2 overflow-hidden rounded border"
      data-block-type="media-embed-component"
    >
      <div className="border-custom-border-200 flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs text-custom-text-300 font-medium">
          {mediaType === "video" ? "Video Embed" : "Image Embed"}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            className="text-xs text-custom-text-200 hover:bg-custom-bg-80 rounded px-2 py-0.5"
            onClick={() => {
              if (!editor.isEditable) return;
              setIsEditing(!isEditing);
            }}
            contentEditable={false}
          >
            {isEditing ? "Preview" : "Edit"}
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-3 p-3" contentEditable={false}>
          <div>
            <label htmlFor="media-embed-url" className="text-xs text-custom-text-200 mb-1 block font-medium">
              URL
            </label>
            <input
              ref={inputRef}
              id="media-embed-url"
              type="url"
              className="border-custom-border-300 bg-custom-bg-100 text-xs text-custom-text-100 focus:border-custom-primary w-full rounded border px-3 py-1.5 focus:outline-none"
              value={src}
              onChange={(e) => validateAndUpdateUrl(e.target.value)}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div>
            <label htmlFor="media-embed-alt" className="text-xs text-custom-text-200 mb-1 block font-medium">
              Alt text
            </label>
            <input
              id="media-embed-alt"
              type="text"
              className="border-custom-border-300 bg-custom-bg-100 text-xs text-custom-text-100 focus:border-custom-primary w-full rounded border px-3 py-1.5 focus:outline-none"
              value={alt}
              onChange={(e) => updateAttributes({ [IMediaEmbedAttributeNames.ALT]: e.target.value })}
              placeholder="Description of the media"
            />
          </div>
          <div>
            <label htmlFor="media-embed-caption" className="text-xs text-custom-text-200 mb-1 block font-medium">
              Caption
            </label>
            <input
              id="media-embed-caption"
              type="text"
              className="border-custom-border-300 bg-custom-bg-100 text-xs text-custom-text-100 focus:border-custom-primary w-full rounded border px-3 py-1.5 focus:outline-none"
              value={caption}
              onChange={(e) => updateAttributes({ [IMediaEmbedAttributeNames.CAPTION]: e.target.value })}
              placeholder="Optional caption"
            />
          </div>
        </div>
      ) : (
        <div className="p-4" contentEditable={false}>
          {renderMedia()}
          {caption && <p className="text-xs text-custom-text-300 mt-2 text-center italic">{caption}</p>}
        </div>
      )}
    </NodeViewWrapper>
  );
}
