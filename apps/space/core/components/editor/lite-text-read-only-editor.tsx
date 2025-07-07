import React from "react";
// plane imports
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";

type LiteTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<ILiteTextReadOnlyEditorProps, "fileHandler" | "mentionHandler">,
  "disabledExtensions" | "flaggedExtensions"
> & {
  anchor: string;
  workspaceId: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ anchor, workspaceId, disabledExtensions, flaggedExtensions, ...props }, ref) => {
    const { getMemberById } = useMember();

    return (
      <LiteTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={disabledExtensions ?? []}
        flaggedExtensions={flaggedExtensions ?? []}
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
        containerClassName={cn(props.containerClassName, "relative p-2")}
      />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
