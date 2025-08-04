import React from "react";
// plane imports
import { type EditorRefApi, type ILiteTextEditorProps, LiteTextEditorWithRef, type TFileHandler } from "@plane/editor";
import type { MakeOptional } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot, IssueCommentToolbar } from "@/components/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type LiteTextEditorWrapperProps = MakeOptional<
  Omit<ILiteTextEditorProps, "fileHandler" | "mentionHandler">,
  "disabledExtensions" | "flaggedExtensions"
> & {
  anchor: string;
  isSubmitting?: boolean;
  showSubmitButton?: boolean;
  workspaceId: string;
} & (
    | {
        editable: false;
      }
    | {
        editable: true;
        uploadFile: TFileHandler["upload"];
      }
  );

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>((props, ref) => {
  const {
    anchor,
    containerClassName,
    disabledExtensions: additionalDisabledExtensions = [],
    editable,
    isSubmitting = false,
    showSubmitButton = true,
    workspaceId,
    ...rest
  } = props;
  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }
  // derived values
  const isEmpty = isCommentEmpty(props.initialValue);
  const editorRef = isMutableRefObject<EditorRefApi>(ref) ? ref.current : null;
  const { liteText: liteTextEditorExtensions } = useEditorFlagging(anchor);

  return (
    <div className="border border-custom-border-200 rounded p-3 space-y-3">
      <LiteTextEditorWithRef
        ref={ref}
        disabledExtensions={[...liteTextEditorExtensions.disabled, ...additionalDisabledExtensions]}
        flaggedExtensions={liteTextEditorExtensions.flagged}
        editable={editable}
        fileHandler={getEditorFileHandlers({
          anchor,
          uploadFile: editable ? props.uploadFile : async () => "",
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
