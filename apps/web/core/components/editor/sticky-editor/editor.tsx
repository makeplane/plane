/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback } from "react";
// plane constants
import type { EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { LiteTextEditorWithRef } from "@plane/editor";
import type { EditorRefApi, ILiteTextEditorProps, TFileHandler } from "@plane/editor";
// components
import type { TSticky } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { StickyEditorToolbar } from "./toolbar";

interface StickyEditorWrapperProps extends Omit<
  Omit<ILiteTextEditorProps, "extendedEditorProps">,
  "disabledExtensions" | "editable" | "flaggedExtensions" | "fileHandler" | "mentionHandler" | "getEditorMetaData"
> {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
  accessSpecifier?: EIssueCommentAccessSpecifier;
  handleAccessChange?: (accessKey: EIssueCommentAccessSpecifier) => void;
  showAccessSpecifier?: boolean;
  showSubmitButton?: boolean;
  isSubmitting?: boolean;
  showToolbarInitially?: boolean;
  showToolbar?: boolean;
  uploadFile: TFileHandler["upload"];
  duplicateFile: TFileHandler["duplicate"];
  parentClassName?: string;
  handleColorChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
}

export const StickyEditor = React.forwardRef(function StickyEditor(
  props: StickyEditorWrapperProps,
  ref: React.ForwardedRef<EditorRefApi>
) {
  const {
    containerClassName,
    workspaceSlug,
    workspaceId,
    projectId,
    handleDelete,
    handleColorChange,
    showToolbarInitially = true,
    showToolbar = true,
    parentClassName = "",
    uploadFile,
    duplicateFile,
    ...rest
  } = props;
  // states
  const [isFocused, setIsFocused] = useState(showToolbarInitially);
  // editor flaggings
  const { liteText: liteTextEditorExtensions } = useEditorFlagging({
    workspaceSlug,
    projectId,
  });
  // parse content
  const { getEditorMetaData } = useParseEditorContent({
    projectId,
    workspaceSlug,
  });
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();

  // Stable wrapper to safely access ref inside callbacks
  const getEditorRef = useCallback((): EditorRefApi | null => {
    if (!ref) return null;
    if (typeof ref === "function") return null;
    return ref.current ?? null;
  }, [ref]);

  return (
    <div
      className={cn("relative border border-subtle rounded-sm", parentClassName)}
      onFocus={() => !showToolbarInitially && setIsFocused(true)}
      onBlur={() => !showToolbarInitially && setIsFocused(false)}
    >
      <LiteTextEditorWithRef
        ref={ref}
        disabledExtensions={[...liteTextEditorExtensions.disabled, "enter-key"]}
        flaggedExtensions={liteTextEditorExtensions.flagged}
        editable
        fileHandler={getEditorFileHandlers({
          projectId,
          uploadFile,
          duplicateFile,
          workspaceId,
          workspaceSlug,
        })}
        getEditorMetaData={getEditorMetaData}
        mentionHandler={{
          renderComponent: () => <></>,
        }}
        extendedEditorProps={{}}
        containerClassName={cn(containerClassName, "relative")}
        {...rest}
      />
      {showToolbar && (
        <div
          className={cn("transition-all duration-300 ease-out origin-top px-4 h-[60px]", {
            "max-h-[60px] opacity-100 scale-y-100": isFocused,
            "max-h-0 opacity-0 scale-y-0 invisible": !isFocused,
          })}
        >
          <StickyEditorToolbar
            executeCommand={(item) => {
              const editorRef = getEditorRef();
              if (editorRef) {
                editorRef.executeMenuItemCommand({
                  itemKey: item.itemKey,
                  ...item.extraProps,
                });
              }
            }}
            handleDelete={handleDelete}
            handleColorChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
});

StickyEditor.displayName = "StickyEditor";
