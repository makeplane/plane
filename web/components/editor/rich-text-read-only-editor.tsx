import React from "react";
import { IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/rich-text-editor";

import { useMention } from "hooks/store";

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface RichTextReadOnlyEditorWrapperProps extends Omit<IRichTextReadOnlyEditor, "mentionHighlights"> {}

export const RichTextReadOnlyEditor = React.forwardRef<EditorHandle, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const editorSuggestions = useMention();

    return (
      <RichTextReadOnlyEditorWithRef ref={ref} mentionHighlights={editorSuggestions.mentionHighlights} {...props} />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
