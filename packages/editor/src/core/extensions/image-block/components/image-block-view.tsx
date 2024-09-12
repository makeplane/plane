import React, { useRef, useState, useCallback, useEffect } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor } from "@tiptap/react";

interface ImageBlockViewProps {
  editor: Editor;
  getPos: () => number;
  node: ProsemirrorNode & {
    attrs: {
      src: string;
      width: string;
      height: string;
    };
  };
  updateAttributes: (attrs: Record<string, any>) => void;
}

const MIN_SIZE = 100;

export const ImageBlockView: React.FC<ImageBlockViewProps> = (props) => {
  const { node, updateAttributes } = props;
  const { src, width, height } = node.attrs;

  const [size, setSize] = useState({ width, height });
  const [isSelected, setIsSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isResizing = useRef(false);
  const aspectRatio = useRef(1);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        aspectRatio.current = img.naturalWidth / img.naturalHeight;
        if (width === "35%" && height === "auto") {
          const containerWidth = containerRef.current?.offsetWidth || 0;
          const newWidth = Math.max(containerWidth * 0.35, MIN_SIZE);
          const newHeight = newWidth / aspectRatio.current;
          setSize({ width: `${newWidth}px`, height: `${newHeight}px` });
        }
      };
    }
  }, [src, width, height]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    setIsSelected(true);
  }, []);

  const handleResize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;

    const newWidth = Math.max(clientX - containerRect.left, MIN_SIZE);
    const newHeight = newWidth / aspectRatio.current;

    setSize({ width: `${newWidth}px`, height: `${newHeight}px` });
  }, []);

  const handleResizeEnd = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      updateAttributes(size);
    }
  }, [size, updateAttributes]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  }, []);

  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Element)) {
        setIsSelected(false);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => handleResize(e);
    const handleGlobalMouseUp = () => handleResizeEnd();

    document.addEventListener("mousedown", handleGlobalMouseDown);
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleGlobalMouseDown);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleResize, handleResizeEnd]);

  return (
    <div ref={containerRef} className="relative inline-block" onMouseDown={handleMouseDown} data-drag-handle>
      <img
        ref={imageRef}
        src={src}
        alt=""
        className="max-w-full object-contain rounded-md"
        style={{
          width: size.width,
          height: size.height,
        }}
      />
      {isSelected && (
        <>
          <div className="absolute inset-0 border-2 border-custom-primary-100 pointer-events-none rounded-md" />
          <div
            className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 size-4 rounded-full bg-custom-primary-100 border-2 border-white cursor-nwse-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};

export default ImageBlockView;
