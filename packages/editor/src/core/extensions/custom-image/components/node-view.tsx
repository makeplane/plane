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
import type { Decoration } from "@tiptap/pm/view";
import { useEffect, useRef, useState } from "react";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
// plane utils
import { cn } from "@plane/utils";
// local imports
import type { CustomImageExtensionType, TCustomImageAttributes } from "../types";
import { ECustomImageStatus } from "../types";
import { hasImageDuplicationFailed } from "../utils";
import { CustomImageBlock } from "./block";
import { CustomImageUploader } from "./uploader";

export type CustomImageNodeViewProps = Omit<NodeViewProps, "extension" | "updateAttributes"> & {
  extension: CustomImageExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TCustomImageAttributes;
  };
  updateAttributes: (attrs: Partial<TCustomImageAttributes>) => void;
  decorations: readonly Decoration[];
};

export function CustomImageNodeView(props: CustomImageNodeViewProps) {
  const { editor, extension, node, updateAttributes, decorations } = props;
  const { src: imgNodeSrc, status } = node.attrs;

  const [isUploaded, setIsUploaded] = useState(!!imgNodeSrc);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [resolvedDownloadSrc, setResolvedDownloadSrc] = useState<string | undefined>(undefined);
  const [imageFromFileSystem, setImageFromFileSystem] = useState<string | undefined>(undefined);
  const [failedToLoadImage, setFailedToLoadImage] = useState(false);

  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(null);
  const imageComponentRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  const hasRetriedOnMount = useRef(false);
  const isDuplicatingRef = useRef(false);

  useEffect(() => {
    const closestEditorContainer = imageComponentRef.current?.closest(".editor-container");
    if (closestEditorContainer) {
      setEditorContainer(closestEditorContainer as HTMLDivElement);
    }
  }, []);

  // the image is already uploaded if the image-component node has src attribute
  // and we need to remove the blob from our file system
  useEffect(() => {
    if (resolvedSrc || imgNodeSrc) {
      setIsUploaded(true);
      setImageFromFileSystem(undefined);
    } else {
      setIsUploaded(false);
    }
  }, [resolvedSrc, imgNodeSrc]);

  useEffect(() => {
    if (!imgNodeSrc) {
      setResolvedSrc(undefined);
      setResolvedDownloadSrc(undefined);
      return;
    }

    setFailedToLoadImage(false);

    const getImageSource = async () => {
      try {
        const url = await extension.options.getImageSource?.(imgNodeSrc);
        if (url) {
          setResolvedSrc(url);
        } else {
          setResolvedSrc(undefined);
          setFailedToLoadImage(true);
        }
        const downloadUrl = await extension.options.getImageDownloadSource?.(imgNodeSrc);
        setResolvedDownloadSrc(downloadUrl);
      } catch (error) {
        console.error("Error fetching image source:", error);
        setResolvedSrc(undefined);
        setFailedToLoadImage(true);
      }
    };
    getImageSource();
  }, [imgNodeSrc, extension.options, editor.isEditable]);

  useEffect(() => {
    const handleDuplication = async () => {
      // Skip duplication in read-only mode (e.g., version diff editor)
      if (!editor.isEditable) return;

      if (status !== ECustomImageStatus.DUPLICATING || !extension.options.duplicateImage || !imgNodeSrc) {
        return;
      }

      // Prevent duplicate calls - check if already duplicating this asset
      if (isDuplicatingRef.current) {
        return;
      }

      isDuplicatingRef.current = true;
      try {
        hasRetriedOnMount.current = true;

        const newAssetId = await extension.options.duplicateImage(imgNodeSrc);

        if (!newAssetId) {
          throw new Error("Duplication returned invalid asset ID");
        }

        setFailedToLoadImage(false);
        updateAttributes({ src: newAssetId, status: ECustomImageStatus.UPLOADED });
      } catch (error: unknown) {
        console.error("Failed to duplicate image:", error);
        // Update status to failed
        updateAttributes({ status: ECustomImageStatus.DUPLICATION_FAILED });
      } finally {
        isDuplicatingRef.current = false;
      }
    };

    handleDuplication();
  }, [editor.isEditable, status, imgNodeSrc, extension.options.duplicateImage, updateAttributes]);

  useEffect(() => {
    // Skip duplication retry in read-only mode (e.g., version diff editor)
    if (!editor.isEditable) return;

    if (hasImageDuplicationFailed(status) && !hasRetriedOnMount.current && imgNodeSrc) {
      hasRetriedOnMount.current = true;
      // Add a small delay before retrying to avoid immediate retries
      updateAttributes({ status: ECustomImageStatus.DUPLICATING });
    }
  }, [editor.isEditable, status, imgNodeSrc, updateAttributes]);

  useEffect(() => {
    if (status === ECustomImageStatus.UPLOADED) {
      hasRetriedOnMount.current = false;
      setFailedToLoadImage(false);
    }
  }, [status]);

  const hasDuplicationFailed = hasImageDuplicationFailed(status);
  const hasValidImageSource = imageFromFileSystem || (isUploaded && (resolvedSrc || imgNodeSrc));
  const shouldShowBlock = hasValidImageSource && !failedToLoadImage && !hasDuplicationFailed;

  return (
    <YChangeNodeViewWrapper
      decorations={decorations}
      className={cn("custom-image-node", {
        "touch-select-none": isTouchDevice,
      })}
    >
      <div className="p-0 mx-0 my-2" data-drag-handle ref={imageComponentRef}>
        {shouldShowBlock && !hasDuplicationFailed ? (
          <CustomImageBlock
            editorContainer={editorContainer}
            imageFromFileSystem={imageFromFileSystem}
            setEditorContainer={setEditorContainer}
            setFailedToLoadImage={setFailedToLoadImage}
            src={resolvedSrc}
            downloadSrc={resolvedDownloadSrc}
            {...props}
          />
        ) : (
          <CustomImageUploader
            failedToLoadImage={failedToLoadImage}
            hasDuplicationFailed={hasDuplicationFailed}
            loadImageFromFileSystem={setImageFromFileSystem}
            maxFileSize={editor.storage.imageComponent?.maxFileSize}
            setIsUploaded={setIsUploaded}
            {...props}
          />
        )}
      </div>
    </YChangeNodeViewWrapper>
  );
}
