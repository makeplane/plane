# Rich Text Editors

This document explains how to integrate Plane's rich text editing capabilities. Do not build custom WYSIWYG editors or use raw `<textarea>` when rich text is required.

## The Standard Pattern

Plane provides a pre-configured `LiteTextEditor` component that handles mentions, file uploads, and standard markdown formatting natively.

### Required Imports
```tsx
import { LiteTextEditor } from "@/components/editor/lite-text/editor";
```

### Component Structure
The `LiteTextEditor` requires extensive context props to function correctly (for mentioning users, uploading files to the right workspace, etc.).

```tsx
import { useRef } from "react";
import type { EditorRefApi } from "@plane/editor";

export const CommentBox = ({ workspaceSlug, workspaceId, projectId, issueId }) => {
  const editorRef = useRef<EditorRefApi>(null);

  const handleSubmit = (e) => {
    // Get markdown content
    const content = editorRef.current?.getEditorVal();
    
    // Clear the editor after submit
    editorRef.current?.clearEditor();
    
    // Send to API...
  };

  return (
    <div className="w-full">
      <LiteTextEditor
        ref={editorRef}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        projectId={projectId}
        issue_id={issueId}
        
        // Configuration Props
        editable={true}
        variant="full" // "full" shows rich toolbar below, "lite" shows minimal inline toolbar
        showToolbarInitially={false} // Expands on focus
        submitButtonText="common.comment" // Custom i18n key for the submit button
        
        // Data handlers
        initialValue="<p>Initial content...</p>"
        onEnterKeyPress={handleSubmit}
        isSubmitting={false} // Shows spinner on submit button
        
        // Disabled features (optional)
        disabledExtensions={["heading", "image"]} 
      />
    </div>
  );
};
```

### Key Technical Rules:
1. **Never use standard inputs for rich text**: If the requirement includes formatting, mentions (`@`), or file uploads, you must use `LiteTextEditor`.
2. **Variants**: 
   - `variant="full"`: Renders a large, expandable text area with a full toolbar spanning the bottom (Standard comment boxes).
   - `variant="lite"`: Renders a compact input with a small floating toolbar (Inline quick edits).
3. **Workspace Props**: You MUST pass `workspaceSlug`, `workspaceId`, and usually `projectId` for the editor to correctly fetch mentionable users and handle image uploads.
4. **Ref Management**: You cannot use standard `onChange` events reliably to get the raw HTML/Markdown. You must pass a `useRef<EditorRefApi>` and call `editorRef.current?.getEditorVal()` on submit.
