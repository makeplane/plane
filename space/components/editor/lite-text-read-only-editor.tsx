import React from "react";
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/lite-text-editor";
import { cn } from "@/helpers/common.helper";
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
        customClassName={cn(props.customClassName, "relative p-2")}
      />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
