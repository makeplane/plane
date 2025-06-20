import React from "react";
// plane imports
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";

type RichTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<IRichTextReadOnlyEditor, "fileHandler" | "mentionHandler">,
  "disabledExtensions"
> & {
  anchor: string;
  workspaceId: string;
};

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ anchor, workspaceId, disabledExtensions, ...props }, ref) => {
    const { getMemberById } = useMember();

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={disabledExtensions ?? []}
        fileHandler={getReadOnlyEditorFileHandlers({
          anchor,
          workspaceId,
        })}
        mentionHandler={{
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
          getMentionedEntityDetails: (id: string) => ({
            display_name: getMemberById(id)?.member__display_name ?? "",
          }),
        }}
        {...props}
        // overriding the customClassName to add relative class passed
        containerClassName={cn("relative p-0 border-none", props.containerClassName)}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
