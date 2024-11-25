import React, { useCallback, useEffect, useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// helpers
import { cn } from "@/helpers/common";
// types
import { EEmbedAttributeNames, TEmbedBlockAttributes } from "./types";

type Props = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TEmbedBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TEmbedBlockAttributes>) => void;
};

export const CustomEmbedBlock: React.FC<Props> = (props) => {
  const { editor, node } = props;
  // states
  const [isResizing, setIsResizing] = useState(false);
  // derived values
  const embedSource = node.attrs[EEmbedAttributeNames.SOURCE];
  const embedWidth = node.attrs[EEmbedAttributeNames.WIDTH];

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResize = useCallback((e: MouseEvent | TouchEvent) => {}, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("mouseleave", handleResizeEnd);
      window.addEventListener("touchmove", handleResize);
      window.addEventListener("touchend", handleResizeEnd);

      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", handleResizeEnd);
        window.removeEventListener("mouseleave", handleResizeEnd);
        window.removeEventListener("touchmove", handleResize);
        window.removeEventListener("touchend", handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  return (
    <NodeViewWrapper as="div" className="editor-embed-component group/embed-component relative my-2">
      <iframe className="rounded-md" src={embedSource} width={embedWidth} />
      {editor.isEditable && (
        <>
          <div
            className={cn(
              "absolute inset-0 border-2 border-custom-primary-100 pointer-events-none rounded-md transition-opacity duration-100 ease-in-out",
              {
                "opacity-100": isResizing,
                "opacity-0 group-hover/embed-component:opacity-100": !isResizing,
              }
            )}
          />
          <div
            className={cn(
              "absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 size-4 rounded-full bg-custom-primary-100 border-2 border-white cursor-nwse-resize transition-opacity duration-100 ease-in-out",
              {
                "opacity-100 pointer-events-auto": isResizing,
                "opacity-0 pointer-events-none group-hover/embed-component:opacity-100 group-hover/embed-component:pointer-events-auto":
                  !isResizing,
              }
            )}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          />
        </>
      )}
    </NodeViewWrapper>
  );
};
