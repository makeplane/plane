import React, { useRef, useState, useCallback, useLayoutEffect } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";
import { ImageShimmer } from "./image-loader";

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
  selected: boolean;
}

const MIN_SIZE = 100;

export const ImageComponent: React.FC<ImageBlockViewProps> = (props) => {
  const { node, updateAttributes, selected, getPos, editor } = props;
  const { src, width, height } = node.attrs;

  const [size, setSize] = useState({ width: width || "35%", height: height || "auto" });
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isResizing = useRef(false);
  const aspectRatio = useRef(1);

  useLayoutEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        aspectRatio.current = img.naturalWidth / img.naturalHeight;
        const initialWidth = Math.max(img.naturalWidth * 0.35, MIN_SIZE);
        const initialHeight = initialWidth / aspectRatio.current;
        setSize({ width: `${initialWidth}px`, height: `${initialHeight}px` });
        setIsLoading(false);
      };
    }
  }, [src]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
  }, []);

  useLayoutEffect(() => {
    // for realtime resizing and undo/redo
    setSize({ width, height });
  }, [width, height]);

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
      className="relative inline-block"
      onMouseDown={handleMouseDown}
      style={{ width: size.width, height: size.height }}
    >
      {isLoading && <ImageShimmer width={size.width} height={size.height} />}
      <img
        ref={imageRef}
        src={src}
        alt=""
        className="max-w-full h-auto object-contain rounded-md"
        style={{
          display: isLoading ? "none" : "block",
          width: size.width,
          height: size.height,
        }}
      />
      {selected && (
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

export default ImageComponent;
