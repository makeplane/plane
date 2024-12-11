import React from "react";
// editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/editor";
// components
import { IssueCommentToolbar } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useMention } from "@/hooks/use-mention";

interface LiteTextEditorWrapperProps
  extends Omit<ILiteTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
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
  // derived values
  const isEmpty = isCommentEmpty(props.initialValue);
  const editorRef = isMutableRefObject<EditorRefApi>(ref) ? ref.current : null;

  return (
    <div className="border border-custom-border-200 rounded p-3 space-y-3">
      <LiteTextEditorWithRef
        ref={ref}
        disabledExtensions={[]}
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
        executeCommand={(item) => {
          // TODO: update this while toolbar homogenization
          // @ts-expect-error type mismatch here
          editorRef?.executeMenuItemCommand({
            itemKey: item.itemKey,
            ...item.extraProps,
          });
        }}
        isSubmitting={isSubmitting}
        showSubmitButton={showSubmitButton}
        handleSubmit={(e) => rest.onEnterKeyPress?.(e)}
        isCommentEmpty={isEmpty}
        editorRef={editorRef}
      />
    </div>
  );
});

LiteTextEditor.displayName = "LiteTextEditor";
