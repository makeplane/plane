// editor
import { TExtensions } from "@plane/editor";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (
  workspaceSlug: string
): {
  documentEditor: TExtensions[];
  liteTextEditor: TExtensions[];
  richTextEditor: TExtensions[];
} => {
  const isIssueEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const isEditorAIOpsEnabled = useFlag(workspaceSlug, "EDITOR_AI_OPS");
  const isCollaborationCursorEnabled = useFlag(workspaceSlug, "COLLABORATION_CURSOR");
  const isCalloutComponentEnabled = useFlag(workspaceSlug, "EDITOR_CALLOUT_COMPONENT");
  // extensions disabled in the document editor
  const documentEditor: TExtensions[] = [];
  const liteTextEditor: TExtensions[] = [];
  const richTextEditor: TExtensions[] = [];
  if (!isIssueEmbedEnabled) documentEditor.push("issue-embed");
  if (!isEditorAIOpsEnabled) documentEditor.push("ai");
  if (!isCollaborationCursorEnabled) documentEditor.push("collaboration-cursor");
  if (!isCalloutComponentEnabled) {
    documentEditor.push("callout");
    liteTextEditor.push("callout");
    richTextEditor.push("callout");
  }

  return {
    documentEditor,
    liteTextEditor,
    richTextEditor,
  };
};
