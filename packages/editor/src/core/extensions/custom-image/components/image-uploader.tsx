import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor } from "@tiptap/core";
import { ImageIcon } from "lucide-react";
// helpers
import { cn } from "@/helpers/common";
// hooks
import { useUploader, useDropZone, uploadFirstImageAndInsertRemaining } from "@/hooks/use-file-upload";
// extensions
import { getImageComponentImageFileMap, ImageAttributes } from "@/extensions/custom-image";

export const CustomImageUploader = (props: {
  failedToLoadImage: boolean;
  editor: Editor;
  selected: boolean;
  loadImageFromFileSystem: (file: string) => void;
  setIsUploaded: (isUploaded: boolean) => void;
  node: ProsemirrorNode & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  getPos: () => number;
}) => {
  const {
    selected,
    failedToLoadImage,
    editor,
    loadImageFromFileSystem,
    node,
    setIsUploaded,
    updateAttributes,
    getPos,
  } = props;
  // ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasTriggeredFilePickerRef = useRef(false);
  const imageEntityId = node.attrs.id;

  const imageComponentImageFileMap = useMemo(() => getImageComponentImageFileMap(editor), [editor]);

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        setIsUploaded(true);
        // Update the node view's src attribute post upload
        updateAttributes({ src: url });
        imageComponentImageFileMap?.delete(imageEntityId);

        const pos = getPos();
        // get current node
        const getCurrentSelection = editor.state.selection;
        const currentNode = editor.state.doc.nodeAt(getCurrentSelection.from);

        // only if the cursor is at the current image component, manipulate
        // the cursor position
        if (currentNode && currentNode.type.name === "imageComponent" && currentNode.attrs.src === url) {
          // control cursor position after upload
          const nextNode = editor.state.doc.nodeAt(pos + 1);

          if (nextNode && nextNode.type.name === "paragraph") {
            // If there is a paragraph node after the image component, move the focus to the next node
            editor.commands.setTextSelection(pos + 1);
          } else {
            // create a new paragraph after the image component post upload
            editor.commands.createParagraphNear();
          }
        }
      }
    },
    [imageComponentImageFileMap, imageEntityId, updateAttributes, getPos]
  );
  // hooks
  const { uploading: isImageBeingUploaded, uploadFile } = useUploader({ onUpload, editor, loadImageFromFileSystem });
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    uploader: uploadFile,
    editor,
    pos: getPos(),
  });

  // the meta data of the image component
  const meta = useMemo(
    () => imageComponentImageFileMap?.get(imageEntityId),
    [imageComponentImageFileMap, imageEntityId]
  );

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
        imageComponentImageFileMap?.set(imageEntityId, { ...meta, hasOpenedFileInputOnce: true });
      }
    }
  }, [meta, uploadFile, imageComponentImageFileMap]);

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const fileList = e.target.files;
      if (!fileList) {
        return;
      }
      await uploadFirstImageAndInsertRemaining(editor, fileList, getPos(), uploadFile);
    },
    [uploadFile, editor, getPos]
  );

  const getDisplayMessage = useCallback(() => {
    const isUploading = isImageBeingUploaded;
    if (failedToLoadImage) {
      return "Error loading image";
    }

    if (isUploading) {
      return "Uploading...";
    }

    if (draggedInside) {
      return "Drop image here";
    }

    return "Add an image";
  }, [draggedInside, failedToLoadImage, isImageBeingUploaded]);

  return (
    <div
      className={cn(
        "image-upload-component flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-custom-text-300 hover:text-custom-text-200 bg-custom-background-90 hover:bg-custom-background-80 border border-dashed border-custom-border-300 transition-all duration-200 ease-in-out cursor-default",
        {
          "hover:text-custom-text-200 cursor-pointer": editor.isEditable,
          "bg-custom-background-80 text-custom-text-200": draggedInside,
          "text-custom-primary-200 bg-custom-primary-100/10 hover:bg-custom-primary-100/10 hover:text-custom-primary-200 border-custom-primary-200/10":
            selected,
          "text-red-500 cursor-default hover:text-red-500": failedToLoadImage,
          "bg-red-500/10 hover:bg-red-500/10": failedToLoadImage && selected,
        }
      )}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={() => {
        if (!failedToLoadImage && editor.isEditable) {
          fileInputRef.current?.click();
        }
      }}
    >
      <ImageIcon className="size-4" />
      <div className="text-base font-medium">{getDisplayMessage()}</div>
      <input
        className="size-0 overflow-hidden"
        ref={fileInputRef}
        hidden
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
        multiple
      />
    </div>
  );
};
