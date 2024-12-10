import React from "react";
// editor
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";

type LiteTextReadOnlyEditorWrapperProps = Omit<
  ILiteTextReadOnlyEditor,
  "disabledExtensions" | "fileHandler" | "mentionHandler"
> & {
  anchor: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ anchor, ...props }, ref) => (
    <LiteTextReadOnlyEditorWithRef
      ref={ref}
      disabledExtensions={[]}
      fileHandler={getReadOnlyEditorFileHandlers({
        anchor,
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
