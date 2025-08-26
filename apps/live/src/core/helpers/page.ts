import { getSchema } from "@tiptap/core";
// plane editor
import { CoreEditorExtensionsWithoutProps, DocumentEditorExtensionsWithoutProps } from "@plane/editor/lib";

export const DOCUMENT_EDITOR_EXTENSIONS = [
  ...CoreEditorExtensionsWithoutProps,
  ...DocumentEditorExtensionsWithoutProps,
];
export const documentEditorSchema = getSchema(DOCUMENT_EDITOR_EXTENSIONS);

/**
 * Extracts the text content from an HTML string
 * @param html HTML string
 * @returns text content
 */
export const extractTextFromHTML = (html: string): string => {
  // Use a regex to extract text between tags
  const textMatch = html.replace(/<[^>]*>/g, "");
  return textMatch || "";
};
