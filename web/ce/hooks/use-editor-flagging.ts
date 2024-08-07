// editor
import { TExtensions } from "@plane/editor";

/**
 * @description extensions disabled in various editors
 * @returns
 * ```ts
 * {
 * documentEditor: TExtensions[]
 * richTextEditor: TExtensions[]
 * }
 * ```
 */
export const useEditorFlagging = (): {
  documentEditor: TExtensions[];
  richTextEditor: TExtensions[];
} => ({
  documentEditor: [],
  richTextEditor: [],
});
