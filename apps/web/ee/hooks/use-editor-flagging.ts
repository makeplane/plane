/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import type { TExtensions } from "@plane/editor";
import { E_INTEGRATION_KEYS } from "@plane/types";
// ce imports
import type { TEditorFlaggingHookReturnType, TEditorFlaggingHookProps } from "@/ce/hooks/use-editor-flagging";
// lib
import { store } from "@/lib/store-context";
// plane web imports
import { EPageStoreType, useFlag, usePageStore } from "@/plane-web/hooks/store";
// hooks
import { useFeatureFlags } from "../hooks/store/use-feature-flags";
import { EWorkspaceFeatures } from "../../core/types/workspace-feature";
import { useAiFlag } from "./store/use-ai-flag";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (props: TEditorFlaggingHookProps): TEditorFlaggingHookReturnType => {
  const { workspaceSlug, storeType } = props;
  // params
  const { pageId } = useParams();
  // store hooks
  const { getIntegrations } = useFeatureFlags();
  // feature flags
  const isWorkItemEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const isEditorAIOpsEnabled =
    useFlag(workspaceSlug, "EDITOR_AI_OPS") &&
    store.workspaceFeatures.isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED);
  const isEditorAiBlocksEnabled = useAiFlag(workspaceSlug, "AI_PAGES_BLOCKS");
  const isCollaborationCursorEnabled = useFlag(workspaceSlug, "COLLABORATION_CURSOR");
  const { isNestedPagesEnabled, isCommentsEnabled } = usePageStore(storeType || EPageStoreType.WORKSPACE);
  const isEditorAttachmentsEnabled = useFlag(workspaceSlug, "EDITOR_ATTACHMENTS");
  const isEditorVideoAttachmentsEnabled = useFlag(workspaceSlug, "EDITOR_VIDEO_ATTACHMENTS");
  const isEditorCopyBlockLinkEnabled = useFlag(workspaceSlug, "EDITOR_COPY_BLOCK_LINK");
  const isEditorMathematicsEnabled = useFlag(workspaceSlug, "EDITOR_MATHEMATICS");
  const isExternalEmbedEnabled = useFlag(workspaceSlug, "EDITOR_EXTERNAL_EMBEDS");
  const isEditorSelectionConversionEnabled = useFlag(workspaceSlug, "EDITOR_SELECTION_CONVERSION");
  const isEditorMultiColumnEnabled = useFlag(workspaceSlug, "EDITOR_MULTI_COLUMN");

  // check integrations
  const integrations = getIntegrations(workspaceSlug);
  const hasDrawioIntegration = integrations.includes(E_INTEGRATION_KEYS.DRAWIO);
  const hasMermaidIntegration = integrations.includes(E_INTEGRATION_KEYS.MERMAID);

  // disabled and flagged in the document editor
  const document = useMemo(
    () => ({
      disabled: new Set<TExtensions>(["selection-conversion", "pi-utility-embed"]),
      flagged: new Set<TExtensions>(),
    }),
    []
  );
  // disabled and flagged in the rich text editor
  const richText = useMemo(
    () => ({
      disabled: new Set<TExtensions>(["selection-conversion", "pi-utility-embed"]),
      flagged: new Set<TExtensions>(),
    }),
    []
  );
  // disabled and flagged in the lite text editor
  const liteText = useMemo(
    () => ({
      disabled: new Set<TExtensions>(["external-embed", "selection-conversion", "pi-utility-embed"]),
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
  if (!isEditorAiBlocksEnabled) {
    document.flagged.add("ai-block");
    richText.disabled.add("ai-block");
    liteText.disabled.add("ai-block");
  }
  if (!isCollaborationCursorEnabled) {
    document.disabled.add("collaboration-caret");
  }
  if (storeType && !isNestedPagesEnabled(workspaceSlug)) {
    document.flagged.add("nested-pages");
  }
  if (!isEditorAttachmentsEnabled) {
    document.flagged.add("attachments");
    richText.flagged.add("attachments");
    liteText.flagged.add("attachments");
  }
  if (!isEditorVideoAttachmentsEnabled) {
    document.flagged.add("video-attachments");
    richText.flagged.add("video-attachments");
    liteText.flagged.add("video-attachments");
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

  if (!isEditorCopyBlockLinkEnabled) {
    document.disabled.add("copy-block-link");
    richText.disabled.add("copy-block-link");
  }

  // check for drawio integration
  if (!hasDrawioIntegration) {
    document.flagged.add("drawio");
  }

  // check for mermaid integration
  if (!hasMermaidIntegration) {
    document.flagged.add("mermaid-diagrams");
    richText.flagged.add("mermaid-diagrams");
  }

  if (pageId && isEditorSelectionConversionEnabled) {
    document.disabled.delete("selection-conversion");
  }
  if (pageId) {
    document.disabled.delete("pi-utility-embed");
  }
  if (!isEditorMultiColumnEnabled) {
    document.flagged.add("multi-column");
    richText.flagged.add("multi-column");
    liteText.flagged.add("multi-column");
  }

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
  };
};
