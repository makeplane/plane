import React from "react";
// plane imports
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";

type LiteTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<ILiteTextReadOnlyEditor, "fileHandler" | "mentionHandler">,
  "disabledExtensions"
> & {
  anchor: string;
  workspaceId: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ anchor, workspaceId, disabledExtensions, ...props }, ref) => (
    <LiteTextReadOnlyEditorWithRef
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
      containerClassName={cn(props.containerClassName, "relative p-2")}
    />
  )
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
