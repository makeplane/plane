import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
// local imports
import type { CustomImageExtensionType, TCustomImageAttributes } from "../types";
import { isImageDuplicationFailed } from "../utils";
import { CustomImageBlock } from "./block";
import { CustomImageUploader } from "./uploader";

export type CustomImageNodeViewProps = Omit<NodeViewProps, "extension" | "updateAttributes"> & {
  extension: CustomImageExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TCustomImageAttributes;
  };
  updateAttributes: (attrs: Partial<TCustomImageAttributes>) => void;
};

export const CustomImageNodeView: React.FC<CustomImageNodeViewProps> = (props) => {
  const { editor, extension, node, updateAttributes } = props;
  const { src: imgNodeSrc, status } = node.attrs;

  const [isUploaded, setIsUploaded] = useState(!!imgNodeSrc);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [resolvedDownloadSrc, setResolvedDownloadSrc] = useState<string | undefined>(undefined);
  const [imageFromFileSystem, setImageFromFileSystem] = useState<string | undefined>(undefined);
  const [failedToLoadImage, setFailedToLoadImage] = useState(false);

  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(null);
  const imageComponentRef = useRef<HTMLDivElement>(null);
  const hasRetriedOnMount = useRef(false);

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

    const getImageSource = async () => {
      const url = await extension.options.getImageSource?.(imgNodeSrc);
      setResolvedSrc(url);
      const downloadUrl = await extension.options.getImageDownloadSource?.(imgNodeSrc);
      setResolvedDownloadSrc(downloadUrl);
    };
    getImageSource();
  }, [imgNodeSrc, extension.options]);

  // Memoize the duplication function to prevent unnecessary re-runs
  const handleDuplication = useCallback(async () => {
    if (status !== "duplicating" || !extension.options.duplicateImage || !imgNodeSrc) {
      return;
    }

    try {
      hasRetriedOnMount.current = true;

      const newAssetId = await extension.options.duplicateImage!(imgNodeSrc);
      // Update node with new source and success status
      updateAttributes({
        src: newAssetId,
        status: "duplicated",
      });
    } catch (error) {
      console.error("Failed to duplicate image:", error);
      // Update status to failed
      updateAttributes({ status: "duplication-failed" });
    }
  }, [status, imgNodeSrc, extension.options.duplicateImage, updateAttributes]);

  // Handle image duplication when status is duplicating
  useEffect(() => {
    if (status === "duplicating") {
      handleDuplication();
    }
  }, [status, handleDuplication]);

  useEffect(() => {
    if (isImageDuplicationFailed(status) && !hasRetriedOnMount.current && imgNodeSrc) {
      hasRetriedOnMount.current = true;
      // Add a small delay before retrying to avoid immediate retries
      updateAttributes({ status: "duplicating" });
    }
  }, [status, imgNodeSrc, updateAttributes]);

  useEffect(() => {
    if (status === "duplicated") {
      hasRetriedOnMount.current = false;
    }
  }, [status]);

  const isDuplicationFailed = isImageDuplicationFailed(status);
  const shouldShowBlock = (isUploaded || imageFromFileSystem) && !failedToLoadImage;

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle ref={imageComponentRef}>
        {shouldShowBlock && !isDuplicationFailed ? (
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
            isDuplicationFailed={isDuplicationFailed}
            loadImageFromFileSystem={setImageFromFileSystem}
            maxFileSize={editor.storage.imageComponent?.maxFileSize}
            setIsUploaded={setIsUploaded}
            {...props}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
