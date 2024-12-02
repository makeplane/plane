import React from "react";
// editor
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMention } from "@/hooks/store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type RichTextReadOnlyEditorWrapperProps = Omit<
  IRichTextReadOnlyEditor,
  "disabledExtensions" | "fileHandler" | "mentionHandler"
> & {
  workspaceSlug: string;
  projectId?: string;
};

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ workspaceSlug, projectId, ...props }, ref) => {
    const { mentionHighlights } = useMention({});
    // editor flaggings
    const { richTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={disabledExtensions}
        fileHandler={getReadOnlyEditorFileHandlers({
          projectId,
          workspaceSlug,
        })}
        mentionHandler={{
          highlights: mentionHighlights,
        }}
        {...props}
        // overriding the containerClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative pl-3")}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
