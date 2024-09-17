import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import { CustomImageNodeViewProps } from "@/extensions/custom-image";
import { cn } from "@/helpers/common";

const MIN_SIZE = 100;

export const CustomImageBlock: React.FC<CustomImageNodeViewProps> = (props) => {
  const { node, updateAttributes, selected, getPos, editor } = props;
  const { src, width, height } = node.attrs;

  const [size, setSize] = useState({ width: width || "35%", height: height || "auto" });
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerRect = useRef<DOMRect | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isResizing = useRef(false);
  const aspectRatioRef = useRef(1);
  const editorContainerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        const editorContainer = document.querySelector(".editor-container");
        if (!editorContainer) {
          console.error("Editor container not found");
          return;
        }
        if (width === "35%") {
          editorContainerRef.current = editorContainer as HTMLElement;

          const editorWidth = editorContainer.clientWidth;
          const initialWidth = Math.max(editorWidth * 0.35, MIN_SIZE);
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const initialHeight = initialWidth / aspectRatio;

          const newSize = {
            width: `${Math.round(initialWidth)}px`,
            height: `${Math.round(initialHeight)}px`,
          };

          setSize(newSize);
          updateAttributes(newSize);
        }
      };
      setIsLoading(false);
    }
  }, [width, height]);

  useLayoutEffect(() => {
    setSize({ width, height });
  }, [width, height]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      if (containerRef.current && editorContainerRef.current) {
        aspectRatioRef.current = Number(size.width.replace("px", "")) / Number(size.height.replace("px", ""));
        containerRect.current = containerRef.current.getBoundingClientRect();
      }
    },
    [size]
  );

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (width && height) {
        aspectRatioRef.current = Number(size.width.replace("px", "")) / Number(size.height.replace("px", ""));
      }

      if (!isResizing.current || !containerRef.current || !containerRect.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;

      const newWidth = Math.max(clientX - containerRect.current.left, MIN_SIZE);
      const newHeight = newWidth / aspectRatioRef.current;

      setSize({ width: `${newWidth}px`, height: `${newHeight}px` });
    },
    [width, height]
  );

  const handleResizeEnd = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      updateAttributes(size);
    }
  }, [size, updateAttributes]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const pos = getPos();
      const nodeSelection = NodeSelection.create(editor.state.doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
    },
    [editor, getPos]
  );

  useEffect(() => {
    const editorContainer = editorContainerRef.current;
    if (!editorContainer) return;

    const handleMouseMove = (e: MouseEvent) => handleResize(e);
    const handleMouseUp = () => handleResizeEnd();

    editorContainer.addEventListener("mousemove", handleMouseMove);
    editorContainer.addEventListener("mouseup", handleMouseUp);

    return () => {
      editorContainer.removeEventListener("mousemove", handleMouseMove);
      editorContainer.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleResize, handleResizeEnd]);

  return (
    <div
      ref={containerRef}
      className="group/image-component relative inline-block max-w-full"
      onMouseDown={handleMouseDown}
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      {isLoading && <div className="animate-pulse bg-custom-background-80 rounded-md" style={{ width, height }} />}
      <img
        ref={imageRef}
        src={src}
        width={size.width}
        height={size.height}
        className={cn("block rounded-md", {
          hidden: isLoading,
          "read-only-image": !editor.isEditable,
        })}
        style={{
          width: size.width,
          height: size.height,
        }}
      />
      {editor.isEditable && selected && <div className="absolute inset-0 size-full bg-custom-primary-500/30" />}
      {editor.isEditable && (
        <>
          <div className="opacity-0 group-hover/image-component:opacity-100 absolute inset-0 border-2 border-custom-primary-100 pointer-events-none rounded-md transition-opacity duration-100 ease-in-out" />
          <div
            className="opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 size-4 rounded-full bg-custom-primary-100 border-2 border-white cursor-nwse-resize transition-opacity duration-100 ease-in-out"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};
