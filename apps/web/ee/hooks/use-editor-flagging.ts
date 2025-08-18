// plane imports
import type { TExtensions } from "@plane/editor";
// ce imports
import { TEditorFlaggingHookReturnType } from "@/ce/hooks/use-editor-flagging";
// plane web hooks
import { store } from "@/lib/store-context";
import { EPageStoreType, useFlag, usePageStore } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "../types/workspace-feature";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (workspaceSlug: string, storeType?: EPageStoreType): TEditorFlaggingHookReturnType => {
  const isWorkItemEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const isEditorAIOpsEnabled =
    useFlag(workspaceSlug, "EDITOR_AI_OPS") &&
    store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);
  const isCollaborationCursorEnabled = useFlag(workspaceSlug, "COLLABORATION_CURSOR");
  const { isNestedPagesEnabled } = usePageStore(storeType || EPageStoreType.WORKSPACE);
  const isEditorAttachmentsEnabled = useFlag(workspaceSlug, "EDITOR_ATTACHMENTS");
  const isEditorMathematicsEnabled = useFlag(workspaceSlug, "EDITOR_MATHEMATICS");
  // disabled and flagged in the document editor
  const documentDisabled: TExtensions[] = [];
  const documentFlagged: TExtensions[] = [];
  // disabled and flagged in the rich text editor
  const richTextDisabled: TExtensions[] = [];
  const richTextFlagged: TExtensions[] = [];
  // disabled and flagged in the lite text editor
  const liteTextDisabled: TExtensions[] = [];
  const liteTextFlagged: TExtensions[] = [];

  if (!isWorkItemEmbedEnabled) {
    documentFlagged.push("issue-embed");
  }
  if (!isEditorAIOpsEnabled) {
    documentDisabled.push("ai");
  }
  if (!isCollaborationCursorEnabled) {
    documentDisabled.push("collaboration-cursor");
  }
  if (storeType && !isNestedPagesEnabled(workspaceSlug)) {
    documentFlagged.push("nested-pages");
  }
  if (!isEditorAttachmentsEnabled) {
    documentFlagged.push("attachments");
    richTextFlagged.push("attachments");
  }
  if (!isEditorMathematicsEnabled) {
    documentFlagged.push("mathematics");
    richTextFlagged.push("mathematics");
    liteTextFlagged.push("mathematics");
  }
  return {
    document: {
      disabled: documentDisabled,
      flagged: documentFlagged,
    },
    liteText: {
      disabled: liteTextDisabled,
      flagged: liteTextFlagged,
    },
    richText: {
      disabled: richTextDisabled,
      flagged: richTextFlagged,
    },
  };
};
