import React from "react";
// editor
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMention, useUser } from "@/hooks/store";

type LiteTextReadOnlyEditorWrapperProps = Omit<ILiteTextReadOnlyEditor, "fileHandler" | "mentionHandler"> & {
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

    return (
      <LiteTextReadOnlyEditorWithRef
        ref={ref}
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
