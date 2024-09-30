import React, { useCallback, useEffect, useRef, useState } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
// extensions
import {
  CustomImageBlock,
  CustomImageUploader,
  UploadEntity,
  UploadImageExtensionStorage,
} from "@/extensions/custom-image";

export type CustomImageNodeViewProps = {
  getPos: () => number;
  editor: Editor;
  node: ProsemirrorNode & {
    attrs: {
      src: string;
      width: number | string;
      height: number | string;
    };
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
};

export const CustomImageNode = (props: CustomImageNodeViewProps) => {
  const { getPos, editor, node, updateAttributes, selected } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const [isUploaded, setIsUploaded] = useState(!!node.attrs.src);

  const id = node.attrs.id as string;
  const editorStorage = editor.storage.imageComponent as UploadImageExtensionStorage | undefined;

  const getUploadEntity = useCallback(
    (): UploadEntity | undefined => editorStorage?.fileMap.get(id),
    [editorStorage, id]
  );

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
    [editor.commands, onUpload]
  );

  useEffect(() => {
    const uploadEntity = getUploadEntity();

    if (uploadEntity) {
      if (uploadEntity.event === "drop" && "file" in uploadEntity) {
        uploadFile(uploadEntity.file);
      } else if (uploadEntity.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        const entity = editorStorage?.fileMap.get(id);
        if (entity && entity.hasOpenedFileInputOnce) return;
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
        if (!entity) return;
        editorStorage?.fileMap.set(id, { ...entity, hasOpenedFileInputOnce: true });
      }
    }
  }, [getUploadEntity, uploadFile]);

  useEffect(() => {
    if (node.attrs.src) {
      setIsUploaded(true);
    }
  }, [node.attrs.src]);

  const existingFile = React.useMemo(() => {
    const entity = getUploadEntity();
    return entity && entity.event === "drop" ? entity.file : undefined;
  }, [getUploadEntity]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle>
        {isUploaded ? (
          <CustomImageBlock
            editor={editor}
            getPos={getPos}
            node={node}
            updateAttributes={updateAttributes}
            selected={selected}
          />
        ) : (
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
