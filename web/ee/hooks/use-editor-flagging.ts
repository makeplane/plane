// editor
import { TExtensions } from "@plane/editor";
// plane web hooks
import { EPageStoreType, useFlag, usePageStore } from "@/plane-web/hooks/store";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (
  workspaceSlug: string,
  storeType?: EPageStoreType
): {
  documentEditor: TExtensions[];
  liteTextEditor: TExtensions[];
  richTextEditor: TExtensions[];
} => {
  const isIssueEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const isEditorAIOpsEnabled = useFlag(workspaceSlug, "EDITOR_AI_OPS");
  const isCollaborationCursorEnabled = useFlag(workspaceSlug, "COLLABORATION_CURSOR");
  // extensions disabled in the document editor
  const documentEditor: TExtensions[] = [];
  if (!isIssueEmbedEnabled) documentEditor.push("issue-embed");
  if (!isEditorAIOpsEnabled) documentEditor.push("ai");
  if (!isCollaborationCursorEnabled) documentEditor.push("collaboration-cursor");

  const { isNestedPagesEnabled } = usePageStore(storeType || EPageStoreType.WORKSPACE);
  if (storeType && !isNestedPagesEnabled(workspaceSlug)) {
    documentEditor.push("nested-pages");
  }

  return {
    documentEditor,
    liteTextEditor: [],
    richTextEditor: [],
  };
};
