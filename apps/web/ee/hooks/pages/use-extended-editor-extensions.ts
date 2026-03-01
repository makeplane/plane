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
// plane editor types
import type { IEditorPropsExtended, TCommentConfig } from "@plane/editor";
import { convertBinaryDataToBase64String } from "@plane/editor";
// hooks
import { EIssuesStoreType, EUserPermissions } from "@plane/types";
import type {
  TPartialProject,
  TSearchEntityRequestPayload,
  TSearchResponse,
  TAIBlockGenerateInputPartial,
  TFeedback,
  TDocumentPayload,
} from "@plane/types";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserProfile } from "@/hooks/store/use-user-profile";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// plane web components
import { AIBlockWidget } from "@/plane-web/components/pages/editor/ai/ai-block-widget";
// plane web hooks
import { useEditorEmbeds } from "@/plane-web/hooks/use-editor-embed";
// store
import { PIService } from "@/services/pi.service";
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { EPageStoreType } from "../store";

export type TExtendedEditorExtensionsConfig = Pick<
  IEditorPropsExtended,
  | "embedHandler"
  | "commentConfig"
  | "isSmoothCursorEnabled"
  | "logoSpinner"
  | "selectionConversion"
  | "aiBlockHandlers"
  | "aiBlockWidgetCallback"
>;

const piService = new PIService();

export type TExtendedEditorExtensionsHookParams = {
  workspaceSlug: string;
  page: TPageInstance;
  storeType: EPageStoreType;
  fetchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  getRedirectionLink: (pageId?: string) => string;
  extensionHandlers?: Map<string, unknown>;
  projectId?: string;
};

export const useExtendedEditorProps = (
  params: TExtendedEditorExtensionsHookParams
): TExtendedEditorExtensionsConfig => {
  const { workspaceSlug, page, storeType, fetchEntity, getRedirectionLink, extensionHandlers, projectId } = params;
  // store hooks
  const {
    canPerformAnyCreateAction,
    permission: { getProjectRoleByWorkspaceSlugAndProjectId },
  } = useUser();
  const {
    data: { is_smooth_cursor_enabled },
  } = useUserProfile();
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const {
    issues: { createIssue },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { getWorkspaceBySlug } = useWorkspace();

  // embed props
  const { embedProps } = useEditorEmbeds({
    fetchEmbedSuggestions: fetchEntity,
    getRedirectionLink,
    workspaceSlug,
    page,
    storeType,
    projectId,
  });
  const workspace = useMemo(() => getWorkspaceBySlug(workspaceSlug), [workspaceSlug]);

  const selectionConversionProps: TExtendedEditorExtensionsConfig["selectionConversion"] = useMemo(() => {
    const canCreateWorkItem = projectId ? canPerformAnyCreateAction : true;
    const projectsList = joinedProjectIds
      ?.map((projectId) => getPartialProjectById(projectId))
      .filter((p): p is TPartialProject => {
        if (!p) return false;
        const projectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, p.id);
        return !!projectRole && projectRole >= EUserPermissions.MEMBER;
      });

    return {
      createWorkItemCallback: async (payload, projectIdFromSelection?: string) => {
        const resolvedProjectId = projectIdFromSelection ?? projectId;
        if (!resolvedProjectId) return;
        const response = await createIssue(workspaceSlug, resolvedProjectId, payload);
        if (!response) return;
        return {
          id: response.id,
        };
      },
      isConversionEnabled: canCreateWorkItem,
      projectSelectionEnabled: projectId ? undefined : { projectsList },
    };
  }, [
    canPerformAnyCreateAction,
    createIssue,
    getPartialProjectById,
    getProjectRoleByWorkspaceSlugAndProjectId,
    joinedProjectIds,
    projectId,
    workspaceSlug,
  ]);

  const aiBlockHandlersProps: IEditorPropsExtended["aiBlockHandlers"] = useMemo(() => {
    const payload = {
      entity_id: page.id,
      entity_type: projectId ? "page" : "wiki",
      workspace_id: workspace?.id,
      project_id: projectId,
    };
    const generateBlockContent = async (data: TAIBlockGenerateInputPartial) =>
      await piService.generateBlockContent({
        ...data,
        ...payload,
      });
    const revisionBlockContent = async (data: { block_id: string; revision_type: string }) =>
      await piService.revisionBlockContent(data);
    const postFeedback = async (data: TFeedback) => await piService.postFeedback({ ...data, ...payload });
    const saveDocument = async () => {
      const editorRef = page.editor.editorRef;
      if (!editorRef) return;

      const document = editorRef.getDocument();
      if (!document) return;

      const payload: TDocumentPayload = {
        description_binary: document.binary ? convertBinaryDataToBase64String(document.binary) : "",
        description_html: document.html,
        description_json: document.json ?? {},
      };

      await page.updateDescription(payload);
    };
    return {
      generateBlockContent,
      revisionBlockContent,
      postFeedback,
      saveDocument,
    };
  }, [workspace?.id, page.id, projectId, page]);

  const extendedEditorProps: TExtendedEditorExtensionsConfig = useMemo(
    () => ({
      embedHandler: embedProps,
      commentConfig: extensionHandlers?.get("comments") as TCommentConfig | undefined,
      isSmoothCursorEnabled: is_smooth_cursor_enabled,
      logoSpinner: LogoSpinner,
      selectionConversion: selectionConversionProps,
      aiBlockHandlers: aiBlockHandlersProps,
      aiBlockWidgetCallback: AIBlockWidget,
    }),
    [embedProps, extensionHandlers, is_smooth_cursor_enabled, selectionConversionProps, aiBlockHandlersProps, page.id]
  );

  return extendedEditorProps;
};
