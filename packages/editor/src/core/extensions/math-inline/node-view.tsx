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
import { EMathInlineAttributeNames } from "./types";
import type { TMathInlineAttributes } from "./types";
// utils
import { renderInlineLatexToHtml } from "./utils";

export function MathInlineNodeView(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const attrs = node.attrs as TMathInlineAttributes;
  const latex = attrs[EMathInlineAttributeNames.LATEX];
  // states
  // a freshly created (empty) node starts in editing mode right away
  const [isEditing, setIsEditing] = useState(() => editor.isEditable && !latex);
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  // refs
  const wrapperRef = useRef<HTMLSpanElement>(null);
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
        const html = await renderInlineLatexToHtml(latex);
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
  };

  // editing state — edit the raw source in an inline textarea; an empty node
  // always shows the source input while the editor is editable
  if (isEditing || (editor.isEditable && !latex)) {
    return (
      <NodeViewWrapper ref={wrapperRef} as="span" className="math-inline" data-node-type="math-inline">
        <textarea
          ref={textareaRef}
          className="math-inline-source"
          value={latex}
          rows={1}
          placeholder={t("mathInline.node_view.placeholder", {
            defaultValue: "Enter LaTeX, e.g. E = mc^2",
          })}
          aria-label={t("mathInline.node_view.edit_aria", {
            defaultValue: "Edit LaTeX source",
          })}
          onChange={(event) =>
            updateAttributes({
              [EMathInlineAttributeNames.LATEX]: event.target.value,
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
      <NodeViewWrapper as="span" className="math-inline math-inline-error" data-node-type="math-inline">
        <button
          type="button"
          className="math-inline-trigger"
          title={`${t("mathInline.node_view.invalid_latex", {
            defaultValue: "Invalid LaTeX",
          })}: ${renderError}`}
          onClick={startEditing}
        >
          <code className="math-inline-error-source">{`$${latex}$`}</code>
        </button>
      </NodeViewWrapper>
    );
  }

  // preview state — rendered formula, click to edit
  return (
    <NodeViewWrapper as="span" className="math-inline" data-node-type="math-inline">
      <button
        type="button"
        className={cn("math-inline-trigger", { "math-inline-empty": !renderedHtml && !latex })}
        aria-label={t("mathInline.node_view.edit_aria", {
          defaultValue: "Edit LaTeX source",
        })}
        onClick={startEditing}
      >
        {renderedHtml ? (
          <span className="math-inline-preview" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        ) : (
          <span className="math-inline-placeholder">
            {t("mathInline.node_view.placeholder", {
              defaultValue: "Enter LaTeX, e.g. E = mc^2",
            })}
          </span>
        )}
      </button>
    </NodeViewWrapper>
  );
}
