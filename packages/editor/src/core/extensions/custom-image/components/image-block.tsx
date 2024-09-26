import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { NodeSelection } from "@tiptap/pm/state";
// extensions
import { CustomImageNodeViewProps, ImageToolbarRoot } from "@/extensions/custom-image";
// helpers
import { cn } from "@/helpers/common";

const MIN_SIZE = 100;

type Pixel = `${number}px`;

export type ImageAttributes = {
  src: string | null;
  width: Pixel | "35%";
  height: Pixel | "auto";
  aspectRatio: number | null;
  id: string | null;
};

type Size = Omit<ImageAttributes, "src" | "id">;

export const CustomImageBlock: React.FC<CustomImageNodeViewProps> = (props) => {
  const { node, updateAttributes, localImage, selected, getPos, editor } = props;
  const { src, width, height, aspectRatio } = node.attrs;
  // states
  const [size, setSize] = useState<Size>({
    width: width || "35%",
    height: height || "auto",
    aspectRatio: aspectRatio || 1,
  });
  const [editorContainer, setEditorContainer] = useState<HTMLElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [imageLoadingError, setImageLoadingError] = useState(false);
  const [initialResizeComplete, setInitialResizeComplete] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRect = useRef<DOMRect | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const closestEditorContainer = img.closest(".editor-container");
    if (!closestEditorContainer) {
      console.error("Editor container not found");
      return;
    }

    setEditorContainer(closestEditorContainer as HTMLElement);
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    if (width === "35%") {
      const editorWidth = closestEditorContainer.clientWidth;
      const initialWidth = Math.max(editorWidth * 0.35, MIN_SIZE);
      const initialHeight = initialWidth / aspectRatio;

      const initialComputedSize = {
        width: `${Math.round(initialWidth)}px` satisfies Pixel,
        height: `${Math.round(initialHeight)}px` satisfies Pixel,
        aspectRatio: aspectRatio,
      };

      setSize(initialComputedSize);
      updateAttributes(initialComputedSize);
    } else {
      // as the aspect ratio in not stored for old images, we need to update the attrs
      let newSize: Size;
      setSize((prevSize) => {
        newSize = { ...prevSize, aspectRatio };
        return newSize;
      });
      updateAttributes(newSize);
    }
    setInitialResizeComplete(true);
  }, [width, updateAttributes]);

  // for real time resizing
  useLayoutEffect(() => {
    setSize((prevSize) => ({ ...prevSize, width, height }));
  }, [width, height]);

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
    updateAttributes(size);
  }, [size, updateAttributes]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      if (containerRef.current && editorContainer) {
        containerRect.current = containerRef.current.getBoundingClientRect();
      }
    },
    [editorContainer]
  );

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

  const shouldShowImageLoader = !(src || localImage) || imageLoadingError || !initialResizeComplete;
  const showImageUtils = editor.isEditable && src && !imageLoadingError && initialResizeComplete;
  const currentImage = src ?? localImage;

  return (
    <div
      ref={containerRef}
      className="group/image-component relative inline-block max-w-full"
      onMouseDown={handleImageMouseDown}
      style={{
        width: size.width,
        aspectRatio: size.aspectRatio,
      }}
    >
      {shouldShowImageLoader && (
        <div
          className="animate-pulse bg-custom-background-80 rounded-md"
          style={{ width: size.width, height: size.height }}
        />
      )}
      <img
        ref={imageRef}
        src={currentImage}
        onLoad={handleImageLoad}
        onError={(e) => {
          console.error("Error loading image", e);
          setImageLoadingError(true);
        }}
        width={size.width}
        className={cn("image-component block rounded-md", {
          hidden: shouldShowImageLoader,
          "read-only-image": !editor.isEditable,
          "blur-sm opacity-80 loading-image": !src,
        })}
        style={{
          width: size.width,
          aspectRatio: size.aspectRatio,
        }}
      />
      {showImageUtils && (
        <ImageToolbarRoot
          containerClassName={
            "absolute top-1 right-1 z-20 bg-black/40 rounded opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto transition-opacity"
          }
          image={{
            src,
            aspectRatio: size.aspectRatio,
            height: size.height,
            width: size.width,
          }}
        />
      )}
      {selected && currentImage === src && <div className="absolute inset-0 size-full bg-custom-primary-500/30" />}
      {showImageUtils && (
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
                "opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto":
                  !isResizing,
              }
            )}
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};
