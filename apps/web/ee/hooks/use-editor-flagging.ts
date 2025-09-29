import { useEffect, useMemo, useState } from "react";
// plane imports
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import type { TExtensions } from "@plane/editor";
// ce imports
import type { TEditorFlaggingHookReturnType, TEditorFlaggingHookProps } from "@/ce/hooks/use-editor-flagging";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// lib
import { store } from "@/lib/store-context";
// plane web imports
import { EPageStoreType, useFlag, usePageStore } from "@/plane-web/hooks/store";
import { SiloAppService } from "@/plane-web/services/integrations/silo.service";
import { EWorkspaceFeatures } from "../types/workspace-feature";
const siloAppService = new SiloAppService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (props: TEditorFlaggingHookProps): TEditorFlaggingHookReturnType => {
  const { workspaceSlug, storeType } = props;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  // feature flags
  const isWorkItemEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const isEditorAIOpsEnabled =
    useFlag(workspaceSlug, "EDITOR_AI_OPS") &&
    store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);
  const isCollaborationCursorEnabled = useFlag(workspaceSlug, "COLLABORATION_CURSOR");
  const { isNestedPagesEnabled, isCommentsEnabled } = usePageStore(storeType || EPageStoreType.WORKSPACE);
  const isEditorAttachmentsEnabled = useFlag(workspaceSlug, "EDITOR_ATTACHMENTS");
  const isEditorMathematicsEnabled = useFlag(workspaceSlug, "EDITOR_MATHEMATICS");
  const isExternalEmbedEnabled = useFlag(workspaceSlug, "EDITOR_EXTERNAL_EMBEDS");
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);

  // disabled and flagged in the document editor
  const document = useMemo(
    () => ({
      disabled: new Set<TExtensions>(),
      flagged: new Set<TExtensions>(),
    }),
    []
  );
  // disabled and flagged in the rich text editor
  const richText = useMemo(
    () => ({
      disabled: new Set<TExtensions>(),
      flagged: new Set<TExtensions>(),
    }),
    []
  );
  // disabled and flagged in the lite text editor
  const liteText = useMemo(
    () => ({
      disabled: new Set<TExtensions>(["external-embed"]),
      flagged: new Set<TExtensions>(),
    }),
    []
  );

  if (!isWorkItemEmbedEnabled) {
    document.flagged.add("issue-embed");
  }
  if (!isEditorAIOpsEnabled) {
    document.disabled.add("ai");
  }
  if (!isCollaborationCursorEnabled) {
    document.disabled.add("collaboration-cursor");
  }
  if (storeType && !isNestedPagesEnabled(workspaceSlug)) {
    document.flagged.add("nested-pages");
  }
  if (!isEditorAttachmentsEnabled) {
    document.flagged.add("attachments");
    richText.flagged.add("attachments");
  }
  if (!isEditorMathematicsEnabled) {
    document.flagged.add("mathematics");
    richText.flagged.add("mathematics");
    liteText.flagged.add("mathematics");
  }
  if (storeType && !isCommentsEnabled(workspaceSlug)) {
    document.flagged.add("comments");
  }
  if (!isExternalEmbedEnabled) {
    document.flagged.add("external-embed");
    richText.flagged.add("external-embed");
    liteText.flagged.add("external-embed");
  }

  // check for drawio integration
  useEffect(() => {
    const checkIntegrations = async () => {
      if (!workspaceId) {
        document.flagged.add("drawio");
        setIsLoadingIntegrations(false);
        return;
      }

      try {
        const integrations = await siloAppService.getEnabledIntegrations(workspaceId);
        const hasDrawio = integrations.some(
          (integration: { connection_provider: TExtensions }) => integration.connection_provider === "drawio"
        );
        if (!hasDrawio) {
          document.flagged.add("drawio");
        }
      } catch (_error) {
        document.flagged.add("drawio");
      } finally {
        setIsLoadingIntegrations(false);
      }
    };

    checkIntegrations();
  }, [document, workspaceId]);

  return {
    document: {
      disabled: Array.from(document.disabled),
      flagged: Array.from(document.flagged),
    },
    liteText: {
      disabled: Array.from(liteText.disabled),
      flagged: Array.from(liteText.flagged),
    },
    richText: {
      disabled: Array.from(richText.disabled),
      flagged: Array.from(richText.flagged),
    },
    isLoadingIntegrations,
  };
};
