import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { memo } from "react";
// types
import type { TDrawioBlockAttributes, TDrawioExtension } from "../types";
// components
import { DrawioBlock } from "./block";

export type DrawioNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: TDrawioExtension;
  node: NodeViewProps["node"] & {
    attrs: TDrawioBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TDrawioBlockAttributes>) => void;
};

export const DrawioNodeView: React.FC<DrawioNodeViewProps> = memo((props) => {
  const { selected } = props;

  return (
    <NodeViewWrapper className="editor-drawio-component relative" contentEditable={false}>
      <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <DrawioBlock {...props} />
        {selected && (
          <div className="absolute inset-0 size-full bg-custom-primary-500/30 pointer-events-none rounded-md" />
        )}
      </div>
    </NodeViewWrapper>
  );
});
