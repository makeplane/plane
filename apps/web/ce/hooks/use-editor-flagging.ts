// editor
import { TExtensions } from "@plane/editor";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (
  workspaceSlug: string
): {
  documentEditor: TExtensions[];
  liteTextEditor: TExtensions[];
  richTextEditor: TExtensions[];
} => ({
  documentEditor: ["ai", "collaboration-cursor"],
  liteTextEditor: ["ai", "collaboration-cursor"],
  richTextEditor: ["ai", "collaboration-cursor"],
});
