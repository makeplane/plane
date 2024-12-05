import React from "react";
// editor
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMention, useUser } from "@/hooks/store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type LiteTextReadOnlyEditorWrapperProps = Omit<
  ILiteTextReadOnlyEditor,
  "disabledExtensions" | "fileHandler" | "mentionHandler"
> & {
  workspaceSlug: string;
  projectId: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ workspaceSlug, projectId, ...props }, ref) => {
    // store hooks
    const { data: currentUser } = useUser();
    const { mentionHighlights } = useMention({
      user: currentUser,
    });
    // editor flaggings
    const { liteTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());

    return (
      <LiteTextReadOnlyEditorWithRef
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
        containerClassName={cn(props.containerClassName, "relative p-2")}
      />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
