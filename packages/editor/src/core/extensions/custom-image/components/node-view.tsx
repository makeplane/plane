import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
// local imports
import type { CustomImageExtensionType, TCustomImageAttributes } from "../types";
import { ECustomImageAttributeNames, ECustomImageStatus } from "../types";
import { hasImageDuplicationFailed } from "../utils";
import { CustomImageBlock } from "./block";
import { CustomImageUploader } from "./uploader";

export type CustomImageNodeViewProps = Omit<NodeViewProps, "extension" | "updateAttributes"> & {
  extension: CustomImageExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TCustomImageAttributes;
  };
  updateAttributes: (attrs: Partial<TCustomImageAttributes>) => void;
};

export function CustomImageNodeView(props: CustomImageNodeViewProps) {
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

    setResolvedSrc(undefined);
    setResolvedDownloadSrc(undefined);
    setFailedToLoadImage(false);

    const getImageSource = async () => {
      try {
        const url = await extension.options.getImageSource?.(imgNodeSrc);
        setResolvedSrc(url);
        const downloadUrl = await extension.options.getImageDownloadSource?.(imgNodeSrc);
        setResolvedDownloadSrc(downloadUrl);
      } catch (error) {
        console.error("Error fetching image source:", error);
        setFailedToLoadImage(true);
      }
    };
    void getImageSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgNodeSrc, extension.options.getImageSource, extension.options.getImageDownloadSource]);

  useEffect(() => {
    const handleDuplication = async () => {
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

    void handleDuplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, imgNodeSrc, extension.options.duplicateImage, updateAttributes]);

  useEffect(() => {
    if (hasImageDuplicationFailed(status) && !hasRetriedOnMount.current && imgNodeSrc) {
      hasRetriedOnMount.current = true;
      // Add a small delay before retrying to avoid immediate retries
      updateAttributes({ status: ECustomImageStatus.DUPLICATING });
    }
  }, [status, imgNodeSrc, updateAttributes]);

  useEffect(() => {
    if (status === ECustomImageStatus.UPLOADED) {
      hasRetriedOnMount.current = false;
      setFailedToLoadImage(false);
    }
  }, [status]);

  const hasDuplicationFailed = hasImageDuplicationFailed(status);
  const hasValidImageSource = imageFromFileSystem || (isUploaded && resolvedSrc);
  const shouldShowBlock = hasValidImageSource && !failedToLoadImage && !hasDuplicationFailed;

  return (
    <NodeViewWrapper key={node.attrs[ECustomImageAttributeNames.ID]}>
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
            maxFileSize={(editor.storage.imageComponent as { maxFileSize?: number } | undefined)?.maxFileSize ?? 0}
            setIsUploaded={setIsUploaded}
            {...props}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
