// editor
import { TExtensions } from "@plane/editor";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

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
export const useEditorFlagging = (
  workspaceSlug: string
): {
  documentEditor: TExtensions[];
  richTextEditor: TExtensions[];
} => {
  const isIssueEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  // extensions disabled in the document editor
  const documentEditor: TExtensions[] = [];
  if (!isIssueEmbedEnabled) documentEditor.push("issue-embed");
  // Temporarily disabled
  documentEditor.push("ai");

  return {
    documentEditor,
    richTextEditor: [],
  };
};
