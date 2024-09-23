import React, { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/core";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { ImageIcon } from "lucide-react";
// helpers
import { cn } from "@/helpers/common";
// Hooks
import { useFileUpload, useDropZone } from "@/hooks/use-file-upload";
// Plugins
import { isFileValid } from "@/plugins/image";
import { NodeSelection } from "@tiptap/pm/state";
import { UploadEntity } from "../custom-image";

type RefType = React.RefObject<HTMLInputElement> | ((instance: HTMLInputElement | null) => void);

const assignRef = (ref: RefType, value: HTMLInputElement | null) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as React.MutableRefObject<HTMLInputElement | null>).current = value;
  }
};

type Pixel = `${number}px`;

export type ImageAttributes = {
  src: string | null;
  width: Pixel | "35%";
  height: Pixel | "auto";
  aspectRatio: number | null;
  id: string | null;
};

export type CustomImageBlockProps = {
  editor: Editor;
  getPos: () => number;
  node: ProsemirrorNode & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Partial<ImageAttributes>) => void;
  selected: boolean;
  fileInputRef: RefType;
  droppedFileBlob?: string;
  uploadFile: (file: File) => Promise<void>;
  isFileUploading: boolean;
  initialEditorContainerWidth: number;
  uploadEntity?: UploadEntity;
};

const MIN_SIZE = 100;

type Size = Omit<ImageAttributes, "src" | "id">;

export const CustomImageBlockNew = (props: CustomImageBlockProps) => {
  const {
    editor,
    getPos,
    node,
    isFileUploading,
    selected,
    fileInputRef,
    droppedFileBlob,
    uploadFile,
    initialEditorContainerWidth,
    updateAttributes,
    uploadEntity,
  } = props;
  const { handleUploadClick, ref: internalRef } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    uploader: uploadFile,
  });
  const { width: nodeWidth, height: nodeHeight, aspectRatio: nodeAspectRatio } = node.attrs;
  // refs
  const imageRef = useRef<HTMLImageElement>(null);
  const localRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRect = useRef<DOMRect | null>(null);
  // states
  const [displayedSrc, setDisplayedSrc] = useState<string | null>(null);
  const [size, setSize] = useState<Size>({
    width: nodeWidth || "35%",
    height: nodeHeight || "auto",
    aspectRatio: null,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [initialResizeComplete, setInitialResizeComplete] = useState(false);

  // for realtime updates of the width and height and initializing size
  useEffect(() => {
    setSize({ width: nodeWidth, height: nodeHeight, aspectRatio: nodeAspectRatio });
  }, [nodeWidth, nodeHeight, nodeAspectRatio]);

  // for loading uploaded files via file picker
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isFileValid(file)) {
        const reader = new FileReader();
        reader.onload = () => {
          setDisplayedSrc(reader.result as string);
        };
        reader.readAsDataURL(file);

        uploadFile(file);
      }
    },
    [uploadFile, editor.storage.image]
  );
  // for loading dropped files
  useEffect(() => {
    if (droppedFileBlob) {
      setDisplayedSrc(droppedFileBlob);
    }
  }, [droppedFileBlob]);
  // for loading remote images
  useEffect(() => {
    if (node.attrs.src) {
      setDisplayedSrc(node.attrs.src);
    }
  }, [node.attrs.src]);

  // on first load, set the aspect ratio and height of the image based on
  // conditions
  const handleImageLoad = useCallback(() => {
    setInitialResizeComplete(false);
    const img = imageRef.current;
    if (!img) {
      console.error("Image reference is undefined");
      return;
    }

    let aspectRatio = nodeAspectRatio;
    if (!aspectRatio) {
      aspectRatio = img.naturalWidth / img.naturalHeight;
    }

    if (nodeWidth === "35%") {
      // the initial width hasn't been set and has to be set to 35% of the editor container
      const closestEditorContainer = img.closest(".editor-container");
      let editorWidth = initialEditorContainerWidth;

      if (closestEditorContainer) {
        editorWidth = closestEditorContainer.clientWidth;
      }

      const initialWidth = Math.max(editorWidth * 0.35, MIN_SIZE);
      const initialHeight = initialWidth / aspectRatio;

      const newSize = {
        width: `${Math.round(initialWidth)}px` satisfies Pixel,
        height: `${Math.round(initialHeight)}px` satisfies Pixel,
        aspectRatio: aspectRatio,
      };

      setSize(newSize);
      updateAttributes(newSize);
    } else {
      // if the width has been set, we need to update the aspect ratio and height
      const newHeight = Number(nodeWidth?.replace("px", "")) / aspectRatio;

      setSize((prevSize) => ({ ...prevSize, aspectRatio, height: `${newHeight}px` }));

      if (newHeight !== Number(nodeHeight?.replace("px", ""))) {
        updateAttributes({ height: `${newHeight}px` });
      }
      if (nodeAspectRatio !== aspectRatio) {
        updateAttributes({ aspectRatio });
      }
    }
    setInitialResizeComplete(true);
  }, [nodeWidth, updateAttributes, nodeAspectRatio, nodeHeight]);

  // resizing lifecycle
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    if (containerRef.current) {
      containerRect.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !containerRect.current || !size.aspectRatio) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const newWidth = Math.max(clientX - containerRect.current.left, MIN_SIZE);
      const newHeight = newWidth / size.aspectRatio;

      setSize((prevSize) => ({ ...prevSize, width: `${newWidth}px`, height: `${newHeight}px` }));
    },
    [size]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    updateAttributes({ width: size.width, height: size.height });
  }, [size, updateAttributes]);

  // handle resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("mouseleave", handleResizeEnd);

      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", handleResizeEnd);
        window.removeEventListener("mouseleave", handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  const handleImageMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const pos = getPos();
      const nodeSelection = NodeSelection.create(editor.state.doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
    },
    [editor, getPos]
  );

  const isRemoteImageBeingUploaded = node.attrs.width === "35%" && node.attrs.height === "auto" && !node.attrs.src;

  console.log(
    "uploadEntity",
    !displayedSrc,
    !isRemoteImageBeingUploaded,
    uploadEntity?.event == "insert",
    !displayedSrc || (!isRemoteImageBeingUploaded && uploadEntity?.event === "insert")
  );

  return (
    <>
      <div
        ref={containerRef}
        className="group/image-component relative inline-block max-w-full"
        onMouseDown={handleImageMouseDown}
        style={{
          width: size.width,
          aspectRatio: size.aspectRatio ?? undefined,
        }}
      >
        {/* if the image hasn't completed it's initial resize but has a src, show a loading placeholder */}
        {!initialResizeComplete && displayedSrc && (
          <div
            className="animate-pulse bg-custom-background-80 rounded-md"
            style={{
              width: size.width === "35%" ? `${0.35 * initialEditorContainerWidth}px` : size.width,
              height: size.height === "auto" ? "100px" : size.height,
            }}
          />
        )}
        {/* if the image has a src, load the image and hide it until the initial resize is complete (while showing the above loader) */}
        {displayedSrc && (
          <img
            ref={imageRef}
            src={displayedSrc || ""}
            onLoad={handleImageLoad}
            className={cn("w-full h-auto rounded-md", {
              hidden: !initialResizeComplete,
              "blur-sm opacity-80": isFileUploading,
            })}
            style={{
              width: size.width,
              aspectRatio: size.aspectRatio ?? undefined,
            }}
          />
        )}
        {/* resize handles to be shown only when the image is selected and is not being uploaded a file */}
        {editor.isEditable && selected && !isFileUploading && (
          <div className="absolute inset-0 size-full bg-custom-primary-500/30" />
        )}
        {editor.isEditable && !isFileUploading && (
          <>
            <div
              className={cn(
                "absolute inset-0 border-2 border-custom-primary-100 pointer-events-none rounded-md transition-opacity duration-100 ease-in-out",
                {
                  "opacity-100": isResizing,
                  "opacity-0 group-hover/image-component:opacity-100": !isResizing,
                }
              )}
            />
            <div
              className={cn(
                "absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 size-4 rounded-full bg-custom-primary-100 border-2 border-white cursor-nwse-resize transition-opacity duration-100 ease-in-out",
                {
                  "opacity-100 pointer-events-auto": isResizing,
                  "opacity-0 group-hover/image-component:opacity-100": !isResizing,
                }
              )}
              onMouseDown={handleResizeStart}
            />
          </>
        )}
      </div>
      {/* if there is no src (remote or local), show the upload button */}
      {!displayedSrc ||
        (isRemoteImageBeingUploaded && uploadEntity?.event === "insert" && (
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
            onClick={handleUploadClick}
          >
            <ImageIcon className="size-4" />
            <div className="text-base font-medium">{draggedInside ? "Drop image here" : "Add an image"}</div>
            <input
              className="size-0 overflow-hidden"
              ref={(element) => {
                localRef.current = element;
                assignRef(fileInputRef, element);
                assignRef(internalRef as RefType, element);
              }}
              hidden
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={onFileChange}
            />
          </div>
        ))}
    </>
  );
};
