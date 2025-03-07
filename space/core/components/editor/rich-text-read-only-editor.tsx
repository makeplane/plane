import React from "react";
// plane imports
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";

type RichTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<IRichTextReadOnlyEditor, "fileHandler" | "mentionHandler">,
  "disabledExtensions"
> & {
  anchor: string;
  workspaceId: string;
};

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ anchor, workspaceId, disabledExtensions, ...props }, ref) => (
    <RichTextReadOnlyEditorWithRef
      ref={ref}
      disabledExtensions={disabledExtensions ?? []}
      fileHandler={getReadOnlyEditorFileHandlers({
        anchor,
        workspaceId,
      })}
      mentionHandler={{
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
      }}
      {...props}
      // overriding the customClassName to add relative class passed
      containerClassName={cn("relative p-0 border-none", props.containerClassName)}
    />
  )
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
