/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { File, Download } from "lucide-react";
import { useEffect, useState } from "react";
// plane imports
import { VideoPlayer } from "@plane/propel/video-player";
import { InViewportRenderer } from "@plane/ui";
import { convertBytesToSize } from "@plane/utils";
// local imports
import { EAttachmentBlockAttributeNames } from "../types";
import { getAttachmentBlockId } from "../utils";
import type { CustomAttachmentNodeViewProps } from "./node-view";

type Props = CustomAttachmentNodeViewProps & {
  isTouchDevice: boolean;
  onDownloadClick: ((src?: string) => void) | undefined;
  resolvedDownloadSource: string | null;
  resolvedSource: string | null;
};

const isMobileAgent = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iOS detection
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  // Android detection
  const isAndroid = /Android/i.test(ua);
  return isIOS || isAndroid;
};

export function CustomAttachmentVideoPreview(props: Props) {
  const { editor, node, resolvedDownloadSource, resolvedSource, selected, isTouchDevice, onDownloadClick } = props;
  const isMobileOS = isMobileAgent(); // use native controls for mobile OS
  // states
  const [isVideoLoaded, setIsVideoLoaded] = useState(isMobileOS);

  // derived values
  const fileName = node.attrs[EAttachmentBlockAttributeNames.FILE_NAME];
  const fileSize = convertBytesToSize(Number(node.attrs[EAttachmentBlockAttributeNames.FILE_SIZE] || 0));

  useEffect(() => {
    setIsVideoLoaded(false);
  }, [resolvedSource]);

  // If it's a mobile device, set the video loaded state to true
  useEffect(() => {
    if (!resolvedSource) return;

    if (isMobileOS) {
      setIsVideoLoaded(true);
    }
  }, [resolvedSource, isMobileOS]);

  const videoPreviewPlaceholder = (
    <div
      key={node.attrs.id}
      id={getAttachmentBlockId(node.attrs.id ?? "")}
      className="rounded-lg overflow-hidden border border-subtle"
      contentEditable={false}
    >
      <div className="py-2 px-3 bg-layer-3 flex items-center gap-2">
        <File className="flex-shrink-0 size-4 text-tertiary" />
        <div className="truncate flex-1">
          <p className="not-prose text-13 truncate">{fileName}</p>
        </div>
        <p className="not-prose text-11 text-tertiary flex-shrink-0">{fileSize}</p>
      </div>
      <div className="w-full h-56 bg-layer-3 animate-pulse" />
    </div>
  );

  return (
    <InViewportRenderer placeholder={videoPreviewPlaceholder} key={node.attrs.id}>
      <div
        key={node.attrs.id}
        id={getAttachmentBlockId(node.attrs.id ?? "")}
        className="rounded-lg overflow-hidden border border-subtle"
        contentEditable={false}
      >
        <div className="py-2 px-3 bg-layer-3 flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <File className="flex-shrink-0 size-4 text-tertiary" />
          <div className="truncate flex-1">
            <p className="not-prose text-13 truncate">{fileName}</p>
          </div>
          <p className="not-prose text-11 text-tertiary flex-shrink-0">{fileSize}</p>
          <a
            href={!isTouchDevice && resolvedDownloadSource ? resolvedDownloadSource : undefined}
            download={fileName}
            className="flex-shrink-0 p-1 rounded hover:bg-layer-1-hover text-tertiary hover:text-secondary transition-colors"
            title="Download"
            onClick={() => {
              if (isTouchDevice && resolvedDownloadSource) onDownloadClick?.(resolvedDownloadSource);
            }}
          >
            <Download className="size-4" />
          </a>
        </div>
        <div className="relative aspect-video">
          {!isVideoLoaded && <div className="absolute inset-0 animate-pulse bg-layer-3 rounded-md" />}
          {resolvedSource && (
            <VideoPlayer
              src={resolvedSource}
              className={`size-full ${isVideoLoaded ? "block" : "hidden"}`}
              selected={selected}
              onLoadedMetadata={() => setIsVideoLoaded(true)}
              onBlur={() => editor?.commands.blur()}
              onFocus={() => editor?.commands.focus()}
              onHandleKeyDown={(event) => {
                if (!editor) return false;
                const view = editor.view;
                let handled = false;

                view.someProp("handleKeyDown", (handler) => {
                  if (handler(view, event)) handled = true;
                  return handled;
                });

                return handled;
              }}
              useNativeControls={isMobileOS}
            />
          )}
        </div>
      </div>
    </InViewportRenderer>
  );
}
