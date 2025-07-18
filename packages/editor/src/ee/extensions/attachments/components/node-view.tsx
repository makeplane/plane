import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
// local imports
import { type AttachmentExtension, type TAttachmentBlockAttributes } from "../types";
import { CustomAttachmentBlock } from "./block";
import { CustomAttachmentFlaggedState } from "./flagged-state";
import { CustomAttachmentUploader } from "./uploader";

export type CustomAttachmentNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: AttachmentExtension;
  node: NodeViewProps["node"] & {
    attrs: TAttachmentBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TAttachmentBlockAttributes>) => void;
};

export const CustomAttachmentNodeView: React.FC<CustomAttachmentNodeViewProps> = (props) => {
  const { extension, node } = props;
  // states
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  // refs
  const attachmentComponentRef = useRef<HTMLDivElement>(null);
  // derived values
  const { src } = node.attrs;
  const isAttachmentUploaded = !!src;
  const isExtensionFlagged = extension.options.isFlagged;

  useEffect(() => {
    if (!src || resolvedSource) return;
    const getAttachmentSource = async () => {
      const source = await extension.options.getAttachmentSource?.(src);
      setResolvedSource(source);
    };
    getAttachmentSource();
  }, [extension.options, resolvedSource, src]);

  return (
    <NodeViewWrapper className="editor-attachment-component">
      {isExtensionFlagged ? (
        <div className="p-0 mx-0 py-2 not-prose">
          <CustomAttachmentFlaggedState />
        </div>
      ) : (
        <div className="p-0 mx-0 py-2 not-prose" ref={attachmentComponentRef} contentEditable={false}>
          {isAttachmentUploaded ? (
            <>{resolvedSource && <CustomAttachmentBlock {...props} resolvedSource={resolvedSource} />}</>
          ) : (
            <CustomAttachmentUploader {...props} />
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};
