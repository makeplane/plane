import React from "react";
import debounce from "lodash/debounce";
// editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/editor";
// components
import { EditorMentionsRoot, IssueCommentToolbar } from "@/components/editor";
// constants
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useEditorMention } from "@/hooks/use-editor-mention";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useFileSize } from "@/plane-web/hooks/use-file-size";

interface LiteTextEditorWrapperProps
  extends Omit<ILiteTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  accessSpecifier?: EIssueCommentAccessSpecifier;
  handleAccessChange?: (accessKey: EIssueCommentAccessSpecifier) => void;
  showAccessSpecifier?: boolean;
  showSubmitButton?: boolean;
  isSubmitting?: boolean;
  uploadFile: (file: File) => Promise<string>;
}

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>((props, ref) => {
  const {
    containerClassName,
    workspaceSlug,
    workspaceId,
    projectId,
    accessSpecifier,
    handleAccessChange,
    showAccessSpecifier = false,
    showSubmitButton = true,
    isSubmitting = false,
    placeholder = "Add comment...",
    uploadFile,
    ...rest
  } = props;
  // editor flaggings
  const { liteTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // use editor mention
  const { fetchMentions } = useEditorMention({
    projectId: projectId?.toString() ?? "",
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  const debouncedFetchMentions = debounce(async (query: string) => {
    const res = await fetchMentions(query, "user_mention");
    return res;
  }, 200);
  // file size
  const { maxFileSize } = useFileSize();
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
        disabledExtensions={disabledExtensions}
        fileHandler={getEditorFileHandlers({
          maxFileSize,
          projectId,
          uploadFile,
          workspaceId,
          workspaceSlug,
        })}
        mentionHandler={{
          searchCallback: async (query) => {
            const res = await debouncedFetchMentions(query);
            if (!res) throw new Error("Failed in fetching mentions");
            return res;
          },
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
        }}
        placeholder={placeholder}
        containerClassName={cn(containerClassName, "relative")}
        {...rest}
      />
      <IssueCommentToolbar
        accessSpecifier={accessSpecifier}
        executeCommand={(item) => {
          // TODO: update this while toolbar homogenization
          // @ts-expect-error type mismatch here
          editorRef?.executeMenuItemCommand({
            itemKey: item.itemKey,
            ...item.extraProps,
          });
        }}
        handleAccessChange={handleAccessChange}
        handleSubmit={(e) => rest.onEnterKeyPress?.(e)}
        isCommentEmpty={isEmpty}
        isSubmitting={isSubmitting}
        showAccessSpecifier={showAccessSpecifier}
        editorRef={editorRef}
        showSubmitButton={showSubmitButton}
      />
    </div>
  );
});

LiteTextEditor.displayName = "LiteTextEditor";
