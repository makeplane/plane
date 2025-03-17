import React from "react";
// plane imports
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEditorConfig } from "@/hooks/editor";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type RichTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<IRichTextReadOnlyEditor, "fileHandler" | "mentionHandler">,
  "disabledExtensions"
> & {
  workspaceId: string;
  workspaceSlug: string;
  projectId?: string;
};

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ workspaceId, workspaceSlug, projectId, disabledExtensions: additionalDisabledExtensions, ...props }, ref) => {
    // editor flaggings
    const { richTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
    // editor config
    const { getReadOnlyEditorFileHandlers } = useEditorConfig();

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={[...disabledExtensions, ...(additionalDisabledExtensions ?? [])]}
        fileHandler={getReadOnlyEditorFileHandlers({
          projectId,
          workspaceId,
          workspaceSlug,
        })}
        mentionHandler={{
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
        }}
        {...props}
        // overriding the containerClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative pl-3")}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
