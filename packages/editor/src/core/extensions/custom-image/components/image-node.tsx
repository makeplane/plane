import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
// extensions
import {
  CustomImageBlock,
  CustomImageUploader,
  ImageAttributes,
  UploadImageExtensionStorage,
} from "@/extensions/custom-image";

export type CustomImageNodeViewProps = {
  getPos: () => number;
  editor: Editor;
  node: ProsemirrorNode & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
  setHasRemoteImageFullyLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  hasRemoteImageFullyLoaded: boolean;
};

export const CustomImageNode = (props: CustomImageNodeViewProps) => {
  const { getPos, editor, node, updateAttributes, selected } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const [isUploaded, setIsUploaded] = useState(!!node.attrs.src);

  const id = node.attrs.id as string;
  const editorStorage = editor.storage.imageComponent as UploadImageExtensionStorage | undefined;
  const [hasRemoteImageFullyLoaded, setHasRemoteImageFullyLoaded] = useState(false);

  const uploadEntity = useMemo(() => editorStorage?.fileMap.get(id), [editorStorage?.fileMap, id]);

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        setIsUploaded(true);
        // Update the node view's src attribute
        updateAttributes({ src: url });
        editorStorage?.fileMap.delete(id);
      }
    },
    [editorStorage?.fileMap, id, updateAttributes]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        // @ts-expect-error - TODO: fix typings, and don't remove await from
        // here for now
        const url: string = await editor?.commands.uploadImage(file);

        if (!url) {
          throw new Error("Something went wrong while uploading the image");
        }
        onUpload(url);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
    [onUpload]
  );

  useEffect(() => {
    if (uploadEntity) {
      if (uploadEntity.event === "drop" && "file" in uploadEntity) {
        uploadFile(uploadEntity.file);
      } else if (uploadEntity.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        if (uploadEntity && uploadEntity.hasOpenedFileInputOnce) return;
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
        if (!uploadEntity) return;
        editorStorage?.fileMap.set(id, { ...uploadEntity, hasOpenedFileInputOnce: true });
      }
    }
  }, [uploadEntity, uploadFile, editorStorage?.fileMap]);

  useEffect(() => {
    if (node.attrs.src) {
      setIsUploaded(true);
    }
  }, [node.attrs.src]);

  const existingFile = useMemo(
    () => (uploadEntity && uploadEntity.event === "drop" ? uploadEntity.file : undefined),
    [uploadEntity]
  );

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle>
        {/* don't show the remote image until we have it fully loaded or if it has src in node attrs */}
        {isUploaded && (
          <CustomImageBlock
            setHasRemoteImageFullyLoaded={setHasRemoteImageFullyLoaded}
            hasRemoteImageFullyLoaded={hasRemoteImageFullyLoaded}
            editor={editor}
            getPos={getPos}
            node={node}
            updateAttributes={updateAttributes}
            selected={selected}
          />
        )}
        {/* only show the uploader with the preview images if the remote image is not fully loaded */}
        {!hasRemoteImageFullyLoaded && (
          <CustomImageUploader
            onUpload={onUpload}
            editor={editor}
            fileInputRef={fileInputRef}
            existingFile={existingFile}
            selected={selected}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
