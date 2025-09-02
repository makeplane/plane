import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
// types
import { TExternalEmbedBlockAttributes } from "@/types";
// components
import { ExternalEmbedBlock } from "./block";
import { ExternalEmbedExtension } from "../types";

export type ExternalEmbedNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: ExternalEmbedExtension;
  node: NodeViewProps["node"] & {
    attrs: TExternalEmbedBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TExternalEmbedBlockAttributes>) => void;
};

export const ExternalEmbedNodeView: React.FC<ExternalEmbedNodeViewProps> = (props) => {
  const { extension, node, selected } = props;
  const ExternalEmbedComponent = extension.options.externalEmbedCallbackComponent;

  return (
    <NodeViewWrapper className="editor-embed-component relative" contentEditable={false}>
      {!node.attrs.src || node.attrs.src.trim() === "" ? (
        <ExternalEmbedBlock {...props} />
      ) : (
        <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <ExternalEmbedComponent {...props} />
          {selected && (
            <div className="absolute inset-0 size-full bg-custom-primary-500/30 pointer-events-none rounded-md" />
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};
