import type { TCommentConfig } from "@plane/editor";

// Specific extension handler types
export type TCommentsEditorExtensionHandlers = TCommentConfig;

// Union of all possible extension handler types
export type TEditorExtensionHandlers = {
  comments?: TCommentsEditorExtensionHandlers;
};

// Generic extension configuration for PageEditorBody
export interface IEditorExtension<T extends keyof TEditorExtensionHandlers = keyof TEditorExtensionHandlers> {
  // Extension identifier (e.g., "comments", "ai-assistant", etc.)
  id: T;
  // Handlers that this extension provides to the editor
  handlers: TEditorExtensionHandlers;
}
