import React from "react";
import { IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/rich-text-editor";
import useEditorSuggestions from "hooks/use-editor-suggestions";

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface RichTextReadOnlyEditorWrapperProps extends Omit<IRichTextReadOnlyEditor, "mentionHighlights"> {}

export const RichTextReadOnlyEditor = React.forwardRef<EditorHandle, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const mentionsConfig = useEditorSuggestions();

    return <RichTextReadOnlyEditorWithRef ref={ref} mentionHighlights={mentionsConfig.mentionHighlights} {...props} />;
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
