import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// plane constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// components
import { FloatingMathModal } from "../../components/floating-modal";
// hooks
import { useMathNodeView } from "../../hooks/use-math-node-view";
// types
import { EMathAttributeNames, type TMathAttributes } from "../../types";
// local types
import type { BlockMathExtensionType } from "../types";
// local components
import { BlockMathEmptyState } from "./empty-state";
import { BlockMathErrorState } from "./error-state";
import { BlockMathView } from "./view";

export type BlockMathNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: BlockMathExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TMathAttributes;
  };
  updateAttributes: (attrs: Partial<TMathAttributes>) => void;
};

export const BlockMathNodeView: React.FC<BlockMathNodeViewProps> = (props) => {
  const { getPos, editor } = props;

  // Use shared hook for common math node logic
  const {
    wrapperRef,
    isModalOpen,
    setIsModalOpen,
    nodeAttrs,
    isDisplayEmpty,
    displayLatex,
    validation,
    isExtensionFlagged,
    handleMouseDown,
    handleSave,
    handleClose,
    handlePreview,
  } = useMathNodeView({
    node: props.node,
    getPos,
    editor,
    extension: props.extension,
    nodeType: ADDITIONAL_EXTENSIONS.BLOCK_MATH,
  });

  return (
    <>
      <NodeViewWrapper
        ref={wrapperRef}
        className={`editor-mathematics-component relative ${editor.isEditable ? "cursor-pointer" : ""}`}
        onMouseDown={handleMouseDown}
        key={nodeAttrs[EMathAttributeNames.ID]}
      >
        {isDisplayEmpty ? (
          <BlockMathEmptyState
            onClick={handleMouseDown}
            selected={isModalOpen}
            editor={editor}
            isEditable={editor.isEditable}
          />
        ) : !validation.isValid ? (
          <BlockMathErrorState
            errorMessage={validation.errorMessage}
            onClick={handleMouseDown}
            isEditable={editor.isEditable}
          />
        ) : (
          <BlockMathView latex={displayLatex} onClick={handleMouseDown} isEditable={editor.isEditable} />
        )}
      </NodeViewWrapper>

      <FloatingMathModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        referenceElement={wrapperRef.current}
        latex={nodeAttrs[EMathAttributeNames.LATEX] || ""}
        onSave={handleSave}
        onClose={handleClose}
        onPreview={handlePreview}
        nodeType={ADDITIONAL_EXTENSIONS.BLOCK_MATH}
        editor={editor}
        getPos={getPos}
        isFlagged={isExtensionFlagged}
      />
    </>
  );
};
