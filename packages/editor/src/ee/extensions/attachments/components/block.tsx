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
import { convertBytesToSize } from "@plane/utils";
// local imports
import { EAttachmentBlockAttributeNames } from "../types";
import { getAttachmentBlockId, isVideoMimeType } from "../utils";
import type { CustomAttachmentNodeViewProps } from "./node-view";
import { CustomAttachmentVideoPreview } from "./video-preview";

type Props = CustomAttachmentNodeViewProps & {
  isTouchDevice: boolean;
  resolvedDownloadSource: string | null;
  resolvedSource: string | null;
};

export function CustomAttachmentBlock(props: Props) {
  const { editor, extension, node, resolvedDownloadSource, resolvedSource, isTouchDevice, selected } = props;

  // states
  const [hasCheckedExistence, setHasCheckedExistence] = useState(false);
  // derived values
  const { src } = node.attrs;
  const isPreview = node.attrs[EAttachmentBlockAttributeNames.PREVIEW];
  const fileType = node.attrs[EAttachmentBlockAttributeNames.FILE_TYPE] ?? "";
  const isVideo = isVideoMimeType(fileType);
  // extension options
  const { onClick } = extension.options;

  useEffect(() => {
    if (hasCheckedExistence || !src) return;
    const checkExistence = async () => {
      try {
        const doesAttachmentExist = await extension.options.checkIfAttachmentExists?.(src);
        if (!doesAttachmentExist) {
          await extension.options.restoreAttachment?.(src);
        }
      } catch (error) {
        console.error("Error in checking attachment existence", error);
      } finally {
        setHasCheckedExistence(true);
      }
    };
    checkExistence();
  }, [hasCheckedExistence, src, extension.options]);

  if (isPreview && isVideo) {
    return (
      <CustomAttachmentVideoPreview
        {...props}
        resolvedDownloadSource={resolvedDownloadSource}
        resolvedSource={resolvedSource}
        onDownloadClick={onClick}
      />
    );
  }

  return (
    <div
      key={node.attrs.id}
      id={getAttachmentBlockId(node.attrs.id ?? "")}
      className="py-3 px-2 rounded-lg bg-layer-3 hover:bg-layer-3-hover border border-subtle-1 flex items-start gap-2 transition-colors"
      contentEditable={false}
    >
      <a
        href={!isTouchDevice && resolvedSource ? resolvedSource : undefined}
        className="flex items-start gap-2 flex-1 min-w-0"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (isTouchDevice && resolvedSource) onClick?.(resolvedSource);
        }}
      >
        <div className="flex-shrink-0 mt-1 size-8 grid place-items-center">
          <File className="flex-shrink-0 size-8 text-tertiary" />
        </div>
        <div className="truncate">
          <p className="not-prose text-13 truncate">{node.attrs[EAttachmentBlockAttributeNames.FILE_NAME]}</p>
          <p className="not-prose text-11 text-tertiary">
            {convertBytesToSize(Number(node.attrs[EAttachmentBlockAttributeNames.FILE_SIZE] || 0))}
          </p>
        </div>
      </a>
      <a
        href={!isTouchDevice && resolvedDownloadSource ? resolvedDownloadSource : undefined}
        download={node.attrs[EAttachmentBlockAttributeNames.FILE_NAME]}
        className="flex-shrink-0 mt-1 p-1.5 rounded hover:bg-layer-2-hover text-tertiary hover:text-secondary transition-colors"
        title="Download"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (isTouchDevice && resolvedDownloadSource) onClick?.(resolvedDownloadSource);
        }}
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}
