import React from "react";
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/rich-text-editor";
import { cn } from "@/helpers/common.helper";
import { useMention } from "@/hooks/store";

interface RichTextReadOnlyEditorWrapperProps extends Omit<IRichTextReadOnlyEditor, "mentionHighlights"> {}

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const { mentionHighlights } = useMention({});

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        mentionHighlights={mentionHighlights}
        {...props}
        // overriding the customClassName to add relative class passed
        customClassName={cn(props.customClassName, "relative")}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
