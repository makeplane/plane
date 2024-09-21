import React from "react";
// editor
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMention } from "@/hooks/use-mention";

type RichTextReadOnlyEditorWrapperProps = Omit<IRichTextReadOnlyEditor, "mentionHandler">;

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const { mentionHighlights } = useMention();

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        mentionHandler={{ highlights: mentionHighlights }}
        {...props}
        // overriding the customClassName to add relative class passed
        containerClassName={cn("relative p-0 border-none", props.containerClassName)}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
