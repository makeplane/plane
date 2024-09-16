import React, { useRef, useState, useCallback, useLayoutEffect } from "react";
import { NodeSelection } from "@tiptap/pm/state";
// extensions
import { CustomImageNodeViewProps } from "@/extensions/custom-image";
// helpers
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
  const aspectRatio = useRef(1);

  useLayoutEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        if (node.attrs.width === "35%" && node.attrs.height === "auto") {
          aspectRatio.current = img.naturalWidth / img.naturalHeight;
          const initialWidth = Math.max(img.naturalWidth * 0.35, MIN_SIZE);
          const initialHeight = initialWidth / aspectRatio.current;
          setSize({ width: `${initialWidth}px`, height: `${initialHeight}px` });
        }
        setIsLoading(false);
      };
    }
  }, [src]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    if (containerRef.current) {
      containerRect.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  useLayoutEffect(() => {
    // for realtime resizing and undo/redo
    setSize({ width, height });
  }, [width, height]);

  const handleResize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing.current || !containerRef.current || !containerRect.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;

    const newWidth = Math.max(clientX - containerRect.current.left, MIN_SIZE);
    const newHeight = newWidth / aspectRatio.current;

    setSize({ width: `${newWidth}px`, height: `${newHeight}px` });
  }, []);

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

  useLayoutEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleResize(e);
    const handleGlobalMouseUp = () => handleResizeEnd();

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
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
