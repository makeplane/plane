import React from "react";
// editor
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMention } from "@/hooks/use-mention";

type LiteTextReadOnlyEditorWrapperProps = Omit<
  ILiteTextReadOnlyEditor,
  "disabledExtensions" | "fileHandler" | "mentionHandler"
> & {
  anchor: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ anchor, ...props }, ref) => {
    const { mentionHighlights } = useMention();

    return (
      <LiteTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={[]}
        fileHandler={getReadOnlyEditorFileHandlers({
          anchor,
        })}
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
