import React from "react";
import { ILiteReadOnlyEditor, LiteTextReadOnlyEditorWithRef } from "@plane/lite-text-editor";

import { useMention } from "hooks/store";

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface LiteTextReadOnlyEditorWrapperProps extends Omit<ILiteReadOnlyEditor, "mentionHighlights"> {}

export const LiteTextReadOnlyEditor = React.forwardRef<EditorHandle, LiteTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const editorSuggestions = useMention();

    return (
      <LiteTextReadOnlyEditorWithRef ref={ref} mentionHighlights={editorSuggestions.mentionHighlights} {...props} />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
