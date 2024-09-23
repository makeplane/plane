import React from "react";
// editor
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMention } from "@/hooks/store";

type RichTextReadOnlyEditorWrapperProps = Omit<IRichTextReadOnlyEditor, "mentionHandler">;

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const { mentionHighlights } = useMention({});

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        mentionHandler={{
          highlights: mentionHighlights,
        }}
        {...props}
        // overriding the containerClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative pl-3")}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
