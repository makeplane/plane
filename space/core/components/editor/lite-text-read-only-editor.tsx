import React from "react";
// editor
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMention } from "@/hooks/use-mention";

interface LiteTextReadOnlyEditorWrapperProps extends Omit<ILiteTextReadOnlyEditor, "mentionHandler"> {}

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const { mentionHighlights } = useMention();

    return (
      <LiteTextReadOnlyEditorWithRef
        ref={ref}
        mentionHandler={{
          highlights: mentionHighlights,
        }}
        {...props}
        // overriding the customClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative p-2")}
      />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
