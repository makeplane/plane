// plane imports
import type { TExtensions } from "@plane/editor";
// ce imports
import type { TEditorFlaggingHookReturnType, TEditorFlaggingHookProps } from "@/ce/hooks/use-editor-flagging";
// plane web hooks
import { store } from "@/lib/store-context";
import { EPageStoreType, useFlag, usePageStore } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "../types/workspace-feature";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (props: TEditorFlaggingHookProps): TEditorFlaggingHookReturnType => {
  const { workspaceSlug, storeType } = props;
  const isWorkItemEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const isEditorAIOpsEnabled =
    useFlag(workspaceSlug, "EDITOR_AI_OPS") &&
    store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);
  const isCollaborationCursorEnabled = useFlag(workspaceSlug, "COLLABORATION_CURSOR");
  const { isNestedPagesEnabled, isCommentsEnabled } = usePageStore(storeType || EPageStoreType.WORKSPACE);
  const isEditorAttachmentsEnabled = useFlag(workspaceSlug, "EDITOR_ATTACHMENTS");
  const isEditorMathematicsEnabled = useFlag(workspaceSlug, "EDITOR_MATHEMATICS");
  const isExternalEmbedEnabled = useFlag(workspaceSlug, "EDITOR_EXTERNAL_EMBEDS");

  // disabled and flagged in the document editor
  const documentDisabled: TExtensions[] = [];
  const documentFlagged: TExtensions[] = [];
  // disabled and flagged in the rich text editor
  const richTextDisabled: TExtensions[] = [];
  const richTextFlagged: TExtensions[] = [];
  // disabled and flagged in the lite text editor
  const liteTextDisabled: TExtensions[] = [];
  const liteTextFlagged: TExtensions[] = [];

  liteTextDisabled.push("external-embed");

  if (!isWorkItemEmbedEnabled) {
    documentFlagged.push("issue-embed");
  }
  if (!isEditorAIOpsEnabled) {
    documentDisabled.push("ai");
  }
  if (!isCollaborationCursorEnabled) {
    // documentDisabled.push("collaboration-cursor");
  }
  if (storeType && !isNestedPagesEnabled(workspaceSlug)) {
    documentFlagged.push("nested-pages");
  }
  // if (!isEditorAttachmentsEnabled) {
  documentFlagged.push("attachments");
  richTextFlagged.push("attachments");
  // }
  if (!isEditorMathematicsEnabled) {
    documentFlagged.push("mathematics");
    richTextFlagged.push("mathematics");
    liteTextFlagged.push("mathematics");
  }
  if (storeType && !isCommentsEnabled(workspaceSlug)) {
    documentFlagged.push("comments");
  }
  if (!isExternalEmbedEnabled) {
    documentFlagged.push("external-embed");
    richTextFlagged.push("external-embed");
    liteTextFlagged.push("external-embed");
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
