import React from "react";
// editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef, TNonColorEditorCommands } from "@plane/editor";
// components
import { IssueCommentToolbar } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useMention } from "@/hooks/use-mention";

interface LiteTextEditorWrapperProps extends Omit<ILiteTextEditor, "fileHandler" | "mentionHandler"> {
  anchor: string;
  workspaceId: string;
  isSubmitting?: boolean;
  showSubmitButton?: boolean;
  uploadFile: (file: File) => Promise<string>;
}

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>((props, ref) => {
  const {
    anchor,
    containerClassName,
    workspaceId,
    isSubmitting = false,
    showSubmitButton = true,
    uploadFile,
    ...rest
  } = props;
  // use-mention
  const { mentionHighlights } = useMention();

  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }
  const isEmpty = isCommentEmpty(props.initialValue);

  return (
    <div className="border border-custom-border-200 rounded p-3 space-y-3">
      <LiteTextEditorWithRef
        ref={ref}
        fileHandler={getEditorFileHandlers({
          anchor,
          uploadFile,
          workspaceId,
        })}
        mentionHandler={{
          highlights: mentionHighlights,
          // suggestions disabled for now
        }}
        {...rest}
        // overriding the containerClassName to add relative class passed
        containerClassName={cn(containerClassName, "relative")}
      />
      <IssueCommentToolbar
        executeCommand={(key) => {
          if (isMutableRefObject<EditorRefApi>(ref)) {
            ref.current?.executeMenuItemCommand({
              itemKey: key as TNonColorEditorCommands,
            });
          }
        }}
        isSubmitting={isSubmitting}
        showSubmitButton={showSubmitButton}
        handleSubmit={(e) => rest.onEnterKeyPress?.(e)}
        isCommentEmpty={isEmpty}
        editorRef={isMutableRefObject<EditorRefApi>(ref) ? ref : null}
      />
    </div>
  );
});

LiteTextEditor.displayName = "LiteTextEditor";
