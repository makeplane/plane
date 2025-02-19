import React, { useState } from "react";
// plane constants
import { EIssueCommentAccessSpecifier } from "@plane/constants";
// plane editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/editor";
// plane types
import { TSticky } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
import { StickyEditorToolbar } from "./toolbar";

interface StickyEditorWrapperProps
  extends Omit<ILiteTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
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
  uploadFile: (file: File) => Promise<string>;
  parentClassName?: string;
  handleColorChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
}

export const StickyEditor = React.forwardRef<EditorRefApi, StickyEditorWrapperProps>((props, ref) => {
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
    ...rest
  } = props;
  // states
  const [isFocused, setIsFocused] = useState(showToolbarInitially);
  // editor flaggings
  const { liteTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // file size
  const { maxFileSize } = useFileSize();
  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }
  // derived values
  const editorRef = isMutableRefObject<EditorRefApi>(ref) ? ref.current : null;

  return (
    <div
      className={cn("relative border border-custom-border-200 rounded", parentClassName)}
      onFocus={() => !showToolbarInitially && setIsFocused(true)}
      onBlur={() => !showToolbarInitially && setIsFocused(false)}
    >
      <LiteTextEditorWithRef
        ref={ref}
        disabledExtensions={[...disabledExtensions, "enter-key"]}
        fileHandler={getEditorFileHandlers({
          maxFileSize,
          projectId,
          uploadFile,
          workspaceId,
          workspaceSlug,
        })}
        mentionHandler={{
          renderComponent: () => <></>,
        }}
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
              // TODO: update this while toolbar homogenization
              // @ts-expect-error type mismatch here
              editorRef?.executeMenuItemCommand({
                itemKey: item.itemKey,
                ...item.extraProps,
              });
            }}
            handleDelete={handleDelete}
            handleColorChange={handleColorChange}
            editorRef={editorRef}
          />
        </div>
      )}
    </div>
  );
});

StickyEditor.displayName = "StickyEditor";
