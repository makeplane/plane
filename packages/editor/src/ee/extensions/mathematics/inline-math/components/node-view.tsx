import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// components
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { FloatingMathModal } from "../../components/floating-modal";
// hooks
import { useMathNodeView } from "../../hooks/use-math-node-view";
// types
import { EMathAttributeNames } from "../../types";
// local types
import { type InlineMathExtensionType, type TInlineMathAttributes } from "../types";
// local components
import { InlineMathEmptyState } from "./empty-state";
import { InlineMathErrorState } from "./error-state";
import { InlineMathView } from "./view";

export type InlineMathNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: InlineMathExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TInlineMathAttributes;
  };
  updateAttributes: (attrs: Partial<TInlineMathAttributes>) => void;
};

export const InlineMathNodeView: React.FC<InlineMathNodeViewProps> = (props) => {
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
    nodeType: ADDITIONAL_EXTENSIONS.INLINE_MATH,
  });

  return (
    <>
      <NodeViewWrapper
        as="span"
        ref={wrapperRef}
        className={editor.isEditable ? "cursor-pointer" : ""}
        onMouseDown={handleMouseDown}
        key={nodeAttrs[EMathAttributeNames.ID]}
      >
        {isDisplayEmpty ? (
          <InlineMathEmptyState onClick={handleMouseDown} isEditable={editor.isEditable} />
        ) : !validation.isValid ? (
          <InlineMathErrorState
            errorMessage={validation.errorMessage}
            onClick={handleMouseDown}
            isEditable={editor.isEditable}
          />
        ) : (
          <InlineMathView latex={displayLatex} onClick={handleMouseDown} isEditable={editor.isEditable} />
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
        nodeType={ADDITIONAL_EXTENSIONS.INLINE_MATH}
        editor={editor}
        getPos={getPos}
        isFlagged={isExtensionFlagged}
      />
    </>
  );
};
