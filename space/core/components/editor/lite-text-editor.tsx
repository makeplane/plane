import React from "react";
// plane imports
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot, IssueCommentToolbar } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";

interface LiteTextEditorWrapperProps
  extends MakeOptional<Omit<ILiteTextEditor, "fileHandler" | "mentionHandler">, "disabledExtensions"> {
  anchor: string;
  workspaceId: string;
  isSubmitting?: boolean;
  showSubmitButton?: boolean;
  uploadFile: TFileHandler["upload"];
}

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>((props, ref) => {
  const {
    anchor,
    containerClassName,
    workspaceId,
    isSubmitting = false,
    showSubmitButton = true,
    uploadFile,
    disabledExtensions,
    ...rest
  } = props;
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
        disabledExtensions={disabledExtensions ?? []}
        fileHandler={getEditorFileHandlers({
          anchor,
          uploadFile,
          workspaceId,
        })}
        mentionHandler={{
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
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
