import React from "react";
// editor
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";

type RichTextReadOnlyEditorWrapperProps = Omit<
  IRichTextReadOnlyEditor,
  "disabledExtensions" | "fileHandler" | "mentionHandler"
> & {
  anchor: string;
};

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ anchor, ...props }, ref) => (
    <RichTextReadOnlyEditorWithRef
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
      containerClassName={cn("relative p-0 border-none", props.containerClassName)}
    />
  )
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
