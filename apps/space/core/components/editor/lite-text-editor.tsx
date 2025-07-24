import React from "react";
// plane imports
import { NodeViewProps } from "@tiptap/react";
import { EditorRefApi, ILiteTextEditorProps, LiteTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot, IssueCommentToolbar } from "@/components/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";

interface LiteTextEditorWrapperProps
  extends MakeOptional<
    Omit<ILiteTextEditorProps, "fileHandler" | "mentionHandler" | "embedHandler">,
    "disabledExtensions" | "flaggedExtensions"
  > {
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
    flaggedExtensions,
    ...rest
  } = props;
  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }
  // derived values
  const isEmpty = isCommentEmpty(props.initialValue);
  const editorRef = isMutableRefObject<EditorRefApi>(ref) ? ref.current : null;
  const embedHandlerConfig = {
    externalEmbedComponent: { widgetCallback: (props: NodeViewProps) => <EmbedHandler {...props} anchor={anchor} /> },
  };
  return (
    <div className="border border-custom-border-200 rounded p-3 space-y-3">
      <LiteTextEditorWithRef
        ref={ref}
        disabledExtensions={disabledExtensions ?? []}
        flaggedExtensions={flaggedExtensions ?? []}
        fileHandler={getEditorFileHandlers({
          anchor,
          uploadFile,
          workspaceId,
        })}
        mentionHandler={{
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
        }}
        {...rest}
        embedHandler={embedHandlerConfig}
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
