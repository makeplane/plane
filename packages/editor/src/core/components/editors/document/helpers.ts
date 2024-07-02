import { Extensions, generateJSON, getSchema } from "@tiptap/core";
import { CoreEditorExtensionsWithoutProps, DocumentEditorExtensionsWithoutProps } from "@/extensions";

/**
 * @description return an object with contentJSON and editorSchema
 * @description contentJSON- ProseMirror JSON from HTML content
 * @description editorSchema- editor schema from extensions
 * @param {string} html
 * @returns {object} {contentJSON, editorSchema}
 */
export const generateJSONfromHTMLForDocumentEditor = (html: string) => {
  const extensions = [...CoreEditorExtensionsWithoutProps(), ...DocumentEditorExtensionsWithoutProps()];
  const contentJSON = generateJSON(html ?? "<p></p>", extensions as Extensions);
  const editorSchema = getSchema(extensions as Extensions);
  return {
    contentJSON,
    editorSchema,
  };
};
