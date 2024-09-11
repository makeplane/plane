import React, { useCallback, useEffect, useRef, useState } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
import ImageBlockView from "@/extensions/image-block/components/image-block-view";
import { UploadImageExtensionStorage, UploadEntity } from "../image-upload";
import { ImageUploader } from "./image-uploader";

interface ImageUploadProps {
  getPos: () => number;
  editor: Editor;
  node: ProsemirrorNode & {
    attrs: {
      src: string;
      width: string;
      height: string;
    };
  };
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ getPos, editor, node, updateAttributes }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const [isUploaded, setIsUploaded] = useState(!!node.attrs.src);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  const id = node.attrs.id as string;
  const editorStorage = editor.storage.imageBlock as UploadImageExtensionStorage | undefined;

  const getUploadEntity = useCallback(
    (): UploadEntity | undefined => editorStorage?.fileMap.get(id),
    [editorStorage, id]
  );

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        setUploadedImageUrl(url);
        setIsUploaded(true);
        // Update the node attributes with the new image URL
        updateAttributes({ src: url });
        editorStorage?.fileMap.delete(id);
      }
    },
    [editorStorage?.fileMap, id, updateAttributes]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        const result = await editor.commands.uploadImage(file)();
        if (result) {
          onUpload(result);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        // Handle error state here if needed
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
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
      }
    }
  }, [getUploadEntity, uploadFile]);

  useEffect(() => {
    if (node.attrs.src) {
      setIsUploaded(true);
    }
  }, [node.attrs]);

  const existingFile = React.useMemo(() => {
    const entity = getUploadEntity();
    return entity && entity.event === "drop" ? entity.file : undefined;
  }, [getUploadEntity]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle>
        {isUploaded ? (
          <ImageBlockView
            editor={editor}
            getPos={getPos}
            node={{
              ...node,
              attrs: {
                ...node.attrs,
              },
            }}
            updateAttributes={(attrs) => editor.commands.updateAttributes("imageBlock", attrs)}
          />
        ) : (
          <ImageUploader onUpload={onUpload} editor={editor} fileInputRef={fileInputRef} existingFile={existingFile} />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ImageUpload;
