import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { NodeSelection } from "@tiptap/pm/state";
// extensions
import { CustomImageNodeViewProps } from "@/extensions/custom-image";
// helpers
import { cn } from "@/helpers/common";

const MIN_SIZE = 100;

export const CustomImageBlock: React.FC<
  CustomImageNodeViewProps & {
    isImageLoaded: boolean;
    displayedSrc: string | null;
    isLoading: boolean;
  }
> = (props) => {
  const { node, updateAttributes, selected, getPos, editor, displayedSrc, isImageLoaded } = props;
  const { src, width, height } = node.attrs;

  const [size, setSize] = useState<{
    width: string;
    height: string;
    aspectRatio: number | null;
  }>({
    width: width || "35%",
    height: height || "auto",
    aspectRatio: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [initialResizeComplete, setInitialResizeComplete] = useState(false);
  const [editorContainer, setEditorContainer] = useState<HTMLElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerRect = useRef<DOMRect | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isShimmerVisible = isLoading || !initialResizeComplete;

  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;

    if (!img) {
      console.error("Image reference is undefined");
      return;
    }

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

      const newSize = {
        width: `${Math.round(initialWidth)}px`,
        height: `${Math.round(initialHeight)}px`,
        aspectRatio: aspectRatio,
      };

      setSize(newSize);
      updateAttributes(newSize);
    } else {
      setSize((prevSize) => ({ ...prevSize, aspectRatio }));
    }
    setInitialResizeComplete(true);
    setIsLoading(false);
  }, [width, updateAttributes]);

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

  return (
    <div
      ref={containerRef}
      className="group/image-component relative inline-block max-w-full"
      onMouseDown={handleImageMouseDown}
      style={{
        width: size.width,
        aspectRatio: size.aspectRatio ?? undefined,
      }}
    >
      {isShimmerVisible && (
        <div
          className="animate-pulse bg-custom-background-80 rounded-md"
          style={{ width: size.width, height: size.height }}
        />
      )}
      <img
        ref={imageRef}
        src={displayedSrc ?? src}
        width={size.width}
        height={size.height}
        onLoad={handleImageLoad}
        className={cn("block rounded-md", {
          hidden: isShimmerVisible,
          "read-only-image": !editor.isEditable,
          "blur-sm opacity-80": isLoading || !isImageLoaded,
        })}
        style={{
          width: size.width,
          aspectRatio: size.aspectRatio ?? undefined,
        }}
      />
      {editor.isEditable && selected && !isShimmerVisible && (
        <div className="absolute inset-0 size-full bg-custom-primary-500/30" />
      )}
      {editor.isEditable && !isShimmerVisible && (
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
