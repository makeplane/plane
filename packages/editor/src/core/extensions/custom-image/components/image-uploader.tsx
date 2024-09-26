import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor } from "@tiptap/core";
import { ImageIcon } from "lucide-react";

// helpers
import { cn } from "@/helpers/common";
// hooks
import { useUploader, useDropZone } from "@/hooks/use-file-upload";
// plugins
import { isFileValid } from "@/plugins/image";
import { UploadImageExtensionStorage } from "../custom-image";
import { ImageAttributes } from "./image-block";

export const CustomImageUploader = (props: {
  editor: Editor;
  selected: boolean;
  setLocalImage: (file: string) => void;
  setIsUploaded: (isUploaded: boolean) => void;
  node: ProsemirrorNode & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  getPos: () => number;
}) => {
  const { selected, editor, setLocalImage, node, setIsUploaded, updateAttributes, getPos } = props;
  // ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasTriggeredFilePickerRef = useRef(false);
  const id = node.attrs.id as string;
  const editorStorage = editor.storage.imageComponent as UploadImageExtensionStorage | undefined;
  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        setIsUploaded(true);
        // Update the node view's src attribute post upload
        updateAttributes({ src: url });
        editorStorage?.fileMap.delete(id);

        // control cursor position after upload
        const pos = getPos();
        const nextNode = editor.state.doc.nodeAt(pos + 1);

        if (nextNode && nextNode.type.name === "paragraph") {
          // If there is a paragraph node after the image component, move the focus to the next node
          editor.commands.setTextSelection(pos + 1);
        } else {
          // create a new paragraph after the image component post upload
          editor.commands.createParagraphNear();
        }
      }
    },
    [editorStorage?.fileMap, id, updateAttributes]
  );
  // hooks
  const { loading, uploadFile } = useUploader({ onUpload, editor, setLocalImage });
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({ uploader: uploadFile });

  // the meta data of the image component
  const meta = useMemo(() => editorStorage?.fileMap.get(id), [editorStorage?.fileMap, id]);

  // if the image component is dropped, we check if it has an existing file
  const existingFile = useMemo(() => (meta && meta.event === "drop" ? meta.file : undefined), [meta]);

  // after the image component is mounted we start the upload process based on
  // it's uploaded
  useEffect(() => {
    if (meta) {
      if (meta.event === "drop" && "file" in meta) {
        uploadFile(meta.file);
      } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        if (meta.hasOpenedFileInputOnce) return;
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
        editorStorage?.fileMap.set(id, { ...meta, hasOpenedFileInputOnce: true });
      }
    }
  }, [meta, uploadFile, editorStorage?.fileMap]);

  // check if the image is dropped and set the local image as the existing file
  useEffect(() => {
    if (existingFile) {
      uploadFile(existingFile);
    }
  }, [existingFile, uploadFile]);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (isFileValid(file)) {
          editor.storage.image.uploadInProgress = true;
          uploadFile(file);
        }
      }
    },
    [uploadFile, editor.storage.image]
  );

  return (
    <div
      className={cn(
        "image-upload-component flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-custom-text-300 hover:text-custom-text-200 bg-custom-background-90 hover:bg-custom-background-80 border border-dashed border-custom-border-300 cursor-pointer transition-all duration-200 ease-in-out",
        {
          "bg-custom-background-80 text-custom-text-200": draggedInside,
        },
        {
          "text-custom-primary-200 bg-custom-primary-100/10": selected,
        }
      )}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={() => fileInputRef.current?.click()}
    >
      <ImageIcon className="size-4" />
      <div className="text-base font-medium">
        {loading ? "Uploading..." : draggedInside ? "Drop image here" : existingFile ? "Uploading..." : "Add an image"}
      </div>
      <input
        className="size-0 overflow-hidden"
        ref={fileInputRef}
        hidden
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />
    </div>
  );
};
