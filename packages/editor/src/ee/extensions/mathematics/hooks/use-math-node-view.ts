import type { Editor } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// plane constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EMathAttributeNames, TMathAttributes, MathematicsExtension, TMathNodeType } from "../types";
// utils
import { validateLaTeX } from "../utils/latex-validator";

export type UseMathNodeViewProps = {
  node: {
    attrs: TMathAttributes;
  };
  getPos: NodeViewProps["getPos"];
  editor: Editor;
  extension: MathematicsExtension;
  nodeType: TMathNodeType;
};

/**
 * Shared hook for math node views that handles common logic for both inline and block math
 */
export const useMathNodeView = (props: UseMathNodeViewProps) => {
  const { node, getPos, editor, extension, nodeType } = props;

  // Derive configuration from nodeType
  const displayMode = nodeType === ADDITIONAL_EXTENSIONS.BLOCK_MATH;

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewLatex, setPreviewLatex] = useState<string | null>(null);

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Extension options
  const { isFlagged: isExtensionFlagged } = extension.options;

  // Node attributes
  const nodeAttrs = node.attrs;
  const isEmpty = !nodeAttrs[EMathAttributeNames.LATEX]?.trim();

  // Display logic - use preview latex if available, otherwise use actual latex
  const displayLatex = previewLatex !== null ? previewLatex : nodeAttrs[EMathAttributeNames.LATEX];
  const isDisplayEmpty = !displayLatex?.trim();

  // LaTeX validation
  const validation = !isDisplayEmpty
    ? validateLaTeX(displayLatex, { displayMode })
    : { isValid: true, errorMessage: "" };

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (editor.isEditable) {
        setIsModalOpen(true);
      }
    },
    [editor]
  );

  const updateMathNode = useCallback(
    (latex: string) => {
      const pos = getPos();
      if (pos !== undefined) {
        if (nodeType === ADDITIONAL_EXTENSIONS.BLOCK_MATH) {
          editor.commands.updateBlockMath({ latex, pos });
        } else {
          editor.commands.updateInlineMath({ latex, pos });
        }
      }
    },
    [getPos, nodeType, editor]
  );

  const cleanLatex = useCallback(
    (latex: string) =>
      // Remove empty lines (lines that contain only whitespace)
      latex
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n"),
    []
  );

  const handleSave = useCallback(
    (latex: string) => {
      const cleanedLatex = cleanLatex(latex);
      updateMathNode(cleanedLatex);
      setIsModalOpen(false);
      setPreviewLatex(null);
    },
    [updateMathNode, cleanLatex]
  );

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setPreviewLatex(null);
  }, []);

  const handlePreview = useCallback((latex: string) => {
    setPreviewLatex(latex);
  }, []);

  // Auto-open modal if openMathModal flag is set
  useEffect(() => {
    const mathStorage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.MATHEMATICS);

    if (mathStorage?.openMathModal && isEmpty && editor.isEditable) {
      mathStorage.openMathModal = false;
      setIsModalOpen(true);
    }
  }, [editor, isEmpty, isExtensionFlagged]);

  return {
    // Refs
    wrapperRef,

    // State
    isModalOpen,
    setIsModalOpen,

    // Computed values
    nodeAttrs,
    isEmpty,
    isDisplayEmpty,
    displayLatex,
    validation,
    isExtensionFlagged,

    // Event handlers
    handleMouseDown,
    handleSave,
    handleClose,
    handlePreview,
  };
};
