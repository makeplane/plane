/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
// plane utils
import { cn } from "@plane/utils";
// types
import { EMathBlockAttributeNames } from "./types";
import type { TMathBlockAttributes } from "./types";
// utils
import { renderLatexToHtml } from "./utils";

export function MathBlockNodeView(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const attrs = node.attrs as TMathBlockAttributes;
  const latex = attrs[EMathBlockAttributeNames.LATEX];
  // states
  // a freshly created (empty) block starts in editing mode right away
  const [isEditing, setIsEditing] = useState(() => editor.isEditable && !latex);
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  // refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // i18n
  const { t } = useTranslation("editor");

  useEffect(() => {
    let isCancelled = false;
    if (!latex) {
      setRenderedHtml(null);
      setRenderError(null);
      return;
    }
    void (async () => {
      try {
        const html = await renderLatexToHtml(latex);
        if (isCancelled) return;
        setRenderedHtml(html);
        setRenderError(null);
      } catch (error: unknown) {
        if (isCancelled) return;
        setRenderedHtml(null);
        setRenderError(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [latex]);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
    if (!editor.isEditable) return;
    setIsEditing(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    // stay in editing mode if focus moved to another element inside this node view
    if (event.relatedTarget instanceof Node && wrapperRef.current?.contains(event.relatedTarget)) return;
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
      editor.commands.focus();
    }
    // let Mod-Enter insert a new paragraph after the math block
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      const nodePos = props.getPos();
      if (nodePos === undefined) return;
      editor
        .chain()
        .insertContentAt(nodePos + node.nodeSize, { type: "paragraph" })
        .focus()
        .run();
    }
  };

  // editing state — show the raw source; an empty block always shows the
  // source input (never a bare placeholder) while the editor is editable
  if (isEditing || (editor.isEditable && !latex)) {
    return (
      <NodeViewWrapper ref={wrapperRef} className="math-block" data-node-type="math-block">
        <textarea
          ref={textareaRef}
          className="math-block-source"
          value={latex}
          rows={Math.max(3, latex.split("\n").length + 1)}
          placeholder={t("mathBlock.node_view.placeholder", {
            defaultValue: "Enter LaTeX, e.g. E = mc^2",
          })}
          aria-label={t("mathBlock.node_view.edit_aria", {
            defaultValue: "Edit LaTeX source",
          })}
          onChange={(event) =>
            updateAttributes({
              [EMathBlockAttributeNames.LATEX]: event.target.value,
            })
          }
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </NodeViewWrapper>
    );
  }

  // render error — show the source and the error instead of crashing
  if (renderError) {
    return (
      <NodeViewWrapper className="math-block math-block-error" data-node-type="math-block" onClick={startEditing}>
        <pre className="math-block-error-source">{latex}</pre>
        <p className="math-block-error-message">
          {t("mathBlock.node_view.invalid_latex", {
            defaultValue: "Invalid LaTeX",
          })}
          {`: ${renderError}`}
        </p>
      </NodeViewWrapper>
    );
  }

  // preview state — rendered formula, click to edit
  return (
    <NodeViewWrapper
      className={cn("math-block", { "math-block-empty": !renderedHtml && !latex })}
      data-node-type="math-block"
      aria-label={t("mathBlock.node_view.edit_aria", {
        defaultValue: "Edit LaTeX source",
      })}
      onClick={startEditing}
    >
      {renderedHtml ? (
        <div className="math-block-preview" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      ) : (
        <span className="math-block-placeholder">
          {t("mathBlock.node_view.placeholder", {
            defaultValue: "Enter LaTeX, e.g. E = mc^2",
          })}
        </span>
      )}
    </NodeViewWrapper>
  );
}
