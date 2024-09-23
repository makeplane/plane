import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
// extensions
import { UploadImageExtensionStorage } from "@/extensions/custom-image";
import { CustomImageBlockNew, ImageAttributes } from "./image-block-new";
import { useUploader } from "@/hooks/use-file-upload";
import { useEditorContainerWidth } from "@/hooks/use-editor-container";

export type CustomImageNodeViewProps = {
  editor: Editor;
  getPos: () => number;
  node: ProsemirrorNode & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Partial<ImageAttributes>) => void;
  selected: boolean;
};

export const CustomImageNode = (props: CustomImageNodeViewProps) => {
  const { getPos, editor, node, updateAttributes, selected } = props;
  const { id } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);

  // if the image is dropped onto the editor, we need to store the blob
  const [droppedFileBlob, setDroppedFileBlob] = useState<string | undefined>(undefined);

  // the imageComponent's storage
  const editorStorage = useMemo(
    () => editor.storage.imageComponent as UploadImageExtensionStorage | undefined,
    [editor.storage]
  );

  // the imageComponent's entity (it depicts how the image was added, either by
  // dropping the image onto the editor or by inserting the image)
  const uploadEntity = useMemo(() => {
    if (id) {
      return editorStorage?.fileMap.get(id);
    }
  }, [editorStorage, id]);

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        updateAttributes({ src: url });
        // after uploading the image, we need to remove the entity from the storage
        if (id) {
          editorStorage?.fileMap.delete(id);
        }
      }
    },
    [editorStorage?.fileMap, id, updateAttributes]
  );

  const { loading: isFileUploading, uploadFile } = useUploader({ onUpload, editor });

  useEffect(() => {
    if (uploadEntity && !hasTriggeredFilePickerRef.current) {
      if (uploadEntity.event === "drop" && "file" in uploadEntity) {
        const file = uploadEntity.file;
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setDroppedFileBlob(result);
        };
        reader.readAsDataURL(file);
        uploadFile(file);
      } else if (uploadEntity.event === "insert" && fileInputRef.current && id) {
        const entity = editorStorage?.fileMap.get(id);
        if (entity && entity.hasOpenedFileInputOnce) return;
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
        if (!entity) return;
        editorStorage?.fileMap.set(id, { ...entity, hasOpenedFileInputOnce: true });
      }
    }
  }, [uploadEntity, uploadFile, editorStorage?.fileMap, id]);

  const initialEditorContainerWidth = useEditorContainerWidth(containerRef);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle ref={containerRef}>
        <CustomImageBlockNew
          fileInputRef={fileInputRef}
          uploadFile={uploadFile}
          editor={editor}
          droppedFileBlob={droppedFileBlob}
          isFileUploading={isFileUploading}
          initialEditorContainerWidth={initialEditorContainerWidth}
          getPos={getPos}
          node={node}
          updateAttributes={updateAttributes}
          selected={selected}
          uploadEntity={uploadEntity}
        />
      </div>
    </NodeViewWrapper>
  );
};
