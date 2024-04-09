import React from "react";
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/rich-text-editor";
import { useMention } from "@/hooks/use-mention";

import { cn } from "@/helpers/common.helper";

interface RichTextReadOnlyEditorWrapperProps extends Omit<IRichTextReadOnlyEditor, "mentionHighlights"> {}

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const { mentionHighlights } = useMention();

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
