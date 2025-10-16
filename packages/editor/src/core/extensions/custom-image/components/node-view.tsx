import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
// local imports
import type { CustomImageExtensionType, TCustomImageAttributes } from "../types";
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
  const { editor, extension, node } = props;
  const { src: imgNodeSrc } = node.attrs;

  const [isUploaded, setIsUploaded] = useState(!!imgNodeSrc);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [resolvedDownloadSrc, setResolvedDownloadSrc] = useState<string | undefined>(undefined);
  const [imageFromFileSystem, setImageFromFileSystem] = useState<string | undefined>(undefined);
  const [failedToLoadImage, setFailedToLoadImage] = useState(false);

  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(null);
  const imageComponentRef = useRef<HTMLDivElement>(null);

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

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle ref={imageComponentRef}>
        {(isUploaded || imageFromFileSystem) && !failedToLoadImage ? (
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
