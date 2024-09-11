import React, { useCallback, useEffect, useRef } from "react";
import { Node } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
import { UploadImageExtensionStorage, UploadEntity } from "../image-upload";
import { ImageUploader } from "./image-uploader";

interface ImageUploadProps {
  getPos: () => number;
  editor: Editor;
  node: Node;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ getPos, editor, node }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);

  const id = node.attrs.id as string;
  const editorStorage = editor.storage.imageUpload as UploadImageExtensionStorage | undefined;

  const getUploadEntity = useCallback(
    (): UploadEntity | undefined => editorStorage?.fileMap.get(id),
    [editorStorage, id]
  );

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        editor.chain().setImageBlock({ src: url }).deleteRange({ from: getPos(), to: getPos() }).focus().run();
      }
    },
    [editor, getPos]
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
      }
    },
    [editor.commands, onUpload]
  );

  useEffect(() => {
    const uploadEntity = getUploadEntity();
    console.log("uploadEntity", uploadEntity);

    if (uploadEntity) {
      if (uploadEntity.event === "drop" && "file" in uploadEntity) {
        uploadFile(uploadEntity.file);
      } else if (uploadEntity.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
      }
    }
  }, [getUploadEntity, uploadFile]);

  const existingFile = React.useMemo(() => {
    const entity = getUploadEntity();
    return entity && entity.event === "drop" ? entity.file : undefined;
  }, [getUploadEntity]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle>
        <ImageUploader onUpload={onUpload} editor={editor} fileInputRef={fileInputRef} existingFile={existingFile} />
      </div>
    </NodeViewWrapper>
  );
};

export default ImageUpload;
