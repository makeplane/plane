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

import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
// plane utils
import { cn } from "@plane/utils";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
// local imports
import type { AttachmentExtension, TAttachmentBlockAttributes } from "../types";
import { EAttachmentBlockAttributeNames, EAttachmentStatus } from "../types";
import { hasAttachmentDuplicationFailed, isAttachmentDuplicating } from "../utils";
import { CustomAttachmentBlock } from "./block";
import { CustomAttachmentFlaggedState } from "./flagged-state";
import { CustomAttachmentUploader } from "./uploader";

export type CustomAttachmentNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: AttachmentExtension;
  node: NodeViewProps["node"] & {
    attrs: TAttachmentBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TAttachmentBlockAttributes>) => void;
};

export function CustomAttachmentNodeView(props: CustomAttachmentNodeViewProps) {
  const { decorations, editor, extension, node, updateAttributes } = props;
  // states
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  const [resolvedDownloadSource, setResolvedDownloadSource] = useState<string | null>(null);
  // refs
  const attachmentComponentRef = useRef<HTMLDivElement>(null);
  const hasRetriedOnMount = useRef(false);
  const isDuplicatingRef = useRef(false);
  // derived values
  const { src, status } = node.attrs;
  const isAttachmentUploaded = !!src;
  const isExtensionFlagged = extension.options.isFlagged;
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;
  const isDuplicating = isAttachmentDuplicating(status);
  const hasDuplicationFailed = hasAttachmentDuplicationFailed(status);
  const isUploading = status === EAttachmentStatus.UPLOADING;
  const shouldShowBlock = isAttachmentUploaded && !isDuplicating && !hasDuplicationFailed && !isUploading;

  useEffect(() => {
    setResolvedSource(null);
    setResolvedDownloadSource(null);
  }, [src]);

  useEffect(() => {
    if (!src || resolvedSource || resolvedDownloadSource) return;
    const getAttachmentSources = async () => {
      const source = await extension.options.getAttachmentSource?.(src);
      setResolvedSource(source);
      const downloadSource = await extension.options.getAttachmentDownloadSource?.(src);
      setResolvedDownloadSource(downloadSource);
    };
    getAttachmentSources();
  }, [src, extension.options, resolvedSource, resolvedDownloadSource]);

  // Handle attachment duplication when status is duplicating
  useEffect(() => {
    const handleDuplication = async () => {
      if (status !== EAttachmentStatus.DUPLICATING || !extension.options.duplicateAttachment || !src) {
        return;
      }

      // Prevent duplicate calls - check if already duplicating this asset
      if (isDuplicatingRef.current) {
        return;
      }

      isDuplicatingRef.current = true;
      try {
        const newAssetId = await extension.options.duplicateAttachment(src);

        if (!newAssetId) {
          throw new Error("Duplication returned invalid asset ID");
        }

        // Update node with new source and success status
        updateAttributes({
          [EAttachmentBlockAttributeNames.SOURCE]: newAssetId,
          [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.UPLOADED,
        });
      } catch {
        // Update status to failed
        updateAttributes({ [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.DUPLICATION_FAILED });
      } finally {
        isDuplicatingRef.current = false;
      }
    };

    handleDuplication();
  }, [status, src, extension.options.duplicateAttachment, updateAttributes]);

  // Retry duplication on mount if it previously failed & reset retry flag when upload succeeds
  useEffect(() => {
    if (status === EAttachmentStatus.UPLOADED) {
      hasRetriedOnMount.current = false;
      return;
    }
    if (hasDuplicationFailed && !hasRetriedOnMount.current && src) {
      hasRetriedOnMount.current = true;
      updateAttributes({ [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.DUPLICATING });
    }
  }, [status, src, hasDuplicationFailed, updateAttributes]);

  return (
    <YChangeNodeViewWrapper
      decorations={decorations}
      className={cn("editor-attachment-component", {
        "touch-select-none": isTouchDevice,
      })}
    >
      {isExtensionFlagged ? (
        <div className="p-0 mx-0 py-2 not-prose">
          <CustomAttachmentFlaggedState />
        </div>
      ) : (
        <div className="p-0 mx-0 py-2 not-prose" ref={attachmentComponentRef} contentEditable={false}>
          {shouldShowBlock ? (
            <>
              <CustomAttachmentBlock
                {...props}
                resolvedDownloadSource={resolvedDownloadSource}
                resolvedSource={resolvedSource}
                isTouchDevice={isTouchDevice}
              />
            </>
          ) : (
            <CustomAttachmentUploader {...props} hasDuplicationFailed={hasDuplicationFailed} />
          )}
        </div>
      )}
    </YChangeNodeViewWrapper>
  );
}
