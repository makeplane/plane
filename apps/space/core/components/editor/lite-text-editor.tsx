import React from "react";
// plane imports
import { LiteTextEditorWithRef } from "@plane/editor";
import type { EditorRefApi, ILiteTextEditorProps, TFileHandler } from "@plane/editor";
import type { MakeOptional } from "@plane/types";
import { cn, isCommentEmpty } from "@plane/utils";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// local imports
import { EditorMentionsRoot } from "./embeds/mentions";
import { IssueCommentToolbar } from "./toolbar";

type LiteTextEditorWrapperProps = MakeOptional<
  Omit<ILiteTextEditorProps, "fileHandler" | "mentionHandler" | "extendedEditorProps">,
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
        extendedEditorProps={{}}
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
