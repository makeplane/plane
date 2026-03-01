/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Editor } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
// plane constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// components
import { FloatingMathModal } from "../../components/floating-modal";
// types
import { EMathAttributeNames } from "../../types";
import type { TMathAttributes, MathematicsExtension } from "../../types";
// utils
import { validateLaTeX } from "../../utils/latex-validator";
// local components
import { InlineMathEmptyState } from "./empty-state";
import { InlineMathErrorState } from "./error-state";
import { InlineMathView } from "./view";

type TInlineMathBlockProps = {
  node: {
    attrs: TMathAttributes;
  };
  editor: Editor;
  getPos: NodeViewProps["getPos"];
  extension: MathematicsExtension;
};

export const InlineMathBlock = memo(function InlineMathBlock(props: TInlineMathBlockProps) {
  const { node, editor, getPos, extension } = props;

  // states
  const [isOpen, setIsOpen] = useState(false);
  const [previewLatex, setPreviewLatex] = useState<string | null>(null);
  // refs
  const blockRef = useRef<HTMLSpanElement>(null);

  // extension options
  const { isFlagged } = extension.options;
  const { isTouchDevice } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isTouchDevice: !!editor?.storage.utility?.isTouchDevice,
    }),
  });

  // node attributes
  const nodeAttrs = node.attrs;
  const isEmpty = !nodeAttrs[EMathAttributeNames.LATEX]?.trim();

  // Display logic - use preview latex if available, otherwise use actual latex
  const displayLatex = previewLatex !== null ? previewLatex : nodeAttrs[EMathAttributeNames.LATEX];
  const isDisplayEmpty = !displayLatex?.trim();

  // LaTeX validation
  const validation = !isDisplayEmpty
    ? validateLaTeX(displayLatex, { displayMode: false })
    : { isValid: true, errorMessage: "" };

  const updateMathNode = useCallback(
    (latex: string) => {
      const pos = getPos();
      if (pos !== undefined) {
        editor.commands.updateInlineMath({ latex, pos });
      }
    },
    [getPos, editor]
  );

  const handleClick = useCallback(() => {
    if (isTouchDevice) {
      extension.options.onClick?.(nodeAttrs, updateMathNode);
      return;
    }
    if (editor.isEditable) {
      setIsOpen(true);
    }
  }, [editor.isEditable, isTouchDevice, extension.options, nodeAttrs, updateMathNode]);

  const cleanLatex = useCallback(
    (latex: string) =>
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
      setIsOpen(false);
      setPreviewLatex(null);
    },
    [updateMathNode, cleanLatex]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPreviewLatex(null);
  }, []);

  const handlePreview = useCallback((latex: string) => {
    setPreviewLatex(latex);
  }, []);

  // Get math storage state
  const { openMathModal } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      openMathModal: editor?.storage.mathematics?.openMathModal ?? false,
    }),
  });

  // Auto-open modal if openMathModal flag is set
  useEffect(() => {
    if (openMathModal && isEmpty && editor.isEditable) {
      editor.storage.mathematics.openMathModal = false;
      setIsOpen(true);
    }
  }, [editor, isEmpty, isFlagged, openMathModal]);

  return (
    <>
      <span ref={blockRef} onClick={handleClick}>
        {isDisplayEmpty ? (
          <InlineMathEmptyState isEditable={editor.isEditable} />
        ) : !validation.isValid ? (
          <InlineMathErrorState errorMessage={validation.errorMessage} isEditable={editor.isEditable} />
        ) : (
          <InlineMathView latex={displayLatex} isEditable={editor.isEditable} />
        )}
      </span>
      <FloatingMathModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        referenceElement={blockRef.current}
        latex={nodeAttrs[EMathAttributeNames.LATEX] || ""}
        onSave={handleSave}
        onClose={handleClose}
        onPreview={handlePreview}
        nodeType={ADDITIONAL_EXTENSIONS.INLINE_MATH}
        editor={editor}
        getPos={getPos}
        isFlagged={isFlagged}
      />
    </>
  );
});
