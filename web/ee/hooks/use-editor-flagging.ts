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
export const useEditorFlagging = (): {
  documentEditor: TExtensions[];
  richTextEditor: TExtensions[];
} => {
  const isIssueEmbedEnabled = useFlag("PAGE_ISSUE_EMBEDS");
  // extensions disabled in the document editor
  const documentEditor: TExtensions[] = [];
  if (!isIssueEmbedEnabled) documentEditor.push("issue-embed");

  return {
    documentEditor,
    richTextEditor: [],
  };
};
