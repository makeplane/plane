import React from "react";
import { ILiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/lite-text-editor";
import useEditorSuggestions from "hooks/use-editor-suggestions";

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface LiteTextReadOnlyEditorWrapperProps extends Omit<ILiteTextReadOnlyEditor, "mentionHighlights"> {}

export const LiteTextReadOnlyEditor = React.forwardRef<EditorHandle, LiteTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const mentionsConfig = useEditorSuggestions();

    return <LiteTextReadOnlyEditorWithRef ref={ref} mentionHighlights={mentionsConfig.mentionHighlights} {...props} />;
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
