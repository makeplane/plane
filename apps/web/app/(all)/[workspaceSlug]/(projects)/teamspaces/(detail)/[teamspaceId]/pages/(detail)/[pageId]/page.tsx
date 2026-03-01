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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane types
import { getButtonStyling } from "@plane/propel/button";
import type { TSearchEntityRequestPayload, TWebhookConnectionQueryParams } from "@plane/types";
import { EFileAssetType } from "@plane/types";
// plane ui
// plane utils
import { cn } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import type { TPageRootConfig, TPageRootHandlers } from "@/components/pages/editor/page-root";
import { PageRoot } from "@/components/pages/editor/page-root";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
import { WorkspaceService } from "@/services/workspace.service";
import { TeamspacePageVersionService } from "@/services/teamspace/teamspace-page-version.service";
import { TeamspacePageService } from "@/services/teamspace/teamspace-pages.service";
import type { Route } from "./+types/page";
const workspaceService = new WorkspaceService();
const teamspacePageService = new TeamspacePageService();
const teamspacePageVersionService = new TeamspacePageVersionService();

const storeType = EPageStoreType.TEAMSPACE;

function TeamspacePageDetailsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, teamspaceId, pageId } = params;
  // store hooks
  const { createPage, fetchPageDetails } = usePageStore(storeType);
  const page = usePage({
    pageId,
    storeType,
  });
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";
  const { id, name, updateDescription } = page ?? {};
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug, {
        ...payload,
        team_id: teamspaceId,
      }),
    [teamspaceId, workspaceSlug]
  );
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    `TEAM_PAGE_DETAILS_${pageId}`,
    () => fetchPageDetails(teamspaceId, pageId),
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  // page root handlers
  const pageRootHandlers: TPageRootHandlers = useMemo(
    () => ({
      create: createPage,
      fetchAllVersions: async (pageId) =>
        await teamspacePageVersionService.fetchAllVersions(workspaceSlug, teamspaceId, pageId),
      fetchDescriptionBinary: async () => {
        if (!id) return;
        return await teamspacePageService.fetchDescriptionBinary(workspaceSlug, teamspaceId, id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) =>
        await teamspacePageVersionService.fetchVersionById(workspaceSlug, teamspaceId, pageId, versionId),
      restoreVersion: async (pageId, versionId) =>
        await teamspacePageVersionService.restoreVersion(workspaceSlug, teamspaceId, pageId, versionId),
      getRedirectionLink: (pageId) => {
        if (pageId) {
          return `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}`;
        } else {
          return `/${workspaceSlug}/teamspaces/${teamspaceId}/pages`;
        }
      },
      updateDescription: updateDescription ?? (async () => {}),
    }),
    [createPage, fetchEntityCallback, id, teamspaceId, updateDescription, workspaceSlug]
  );
  // page root config
  const pageRootConfig: TPageRootConfig = useMemo(
    () => ({
      fileHandler: getEditorFileHandlers({
        uploadFile: async (blockId, file) => {
          const { asset_id } = await uploadEditorAsset({
            blockId,
            file,
            data: {
              entity_identifier: id ?? "",
              entity_type: EFileAssetType.PAGE_DESCRIPTION,
            },
            workspaceSlug,
          });
          return asset_id;
        },
        duplicateFile: async (assetId: string) => {
          const { asset_id } = await duplicateEditorAsset({
            assetId,
            entityId: id,
            entityType: EFileAssetType.PAGE_DESCRIPTION,
            workspaceSlug,
          });
          return asset_id;
        },
        workspaceId,
        workspaceSlug,
      }),
    }),
    [duplicateEditorAsset, getEditorFileHandlers, id, uploadEditorAsset, workspaceId, workspaceSlug]
  );

  const webhookConnectionParams: TWebhookConnectionQueryParams = useMemo(
    () => ({
      documentType: "teamspace_page",
      teamspaceId,
      workspaceSlug,
    }),
    [teamspaceId, workspaceSlug]
  );

  if ((!page || !id) && !pageDetailsError)
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );

  if (pageDetailsError)
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <h3 className="text-h6-semibold text-center">Page not found</h3>
        <p className="text-body-xs-regular text-secondary text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link
          href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages`}
          className={cn(getButtonStyling("secondary", "base"), "mt-5")}
        >
          View other Pages
        </Link>
      </div>
    );

  if (!page) return null;

  return (
    <>
      <PageHead title={name} />
      <div className="flex h-full flex-col justify-between">
        <div className="relative h-full w-full flex-shrink-0 flex flex-col overflow-hidden">
          <PageRoot
            config={pageRootConfig}
            handlers={pageRootHandlers}
            page={page}
            storeType={storeType}
            webhookConnectionParams={webhookConnectionParams}
            workspaceSlug={workspaceSlug}
          />
          <IssuePeekOverview />
          <EpicPeekOverview />
        </div>
      </div>
    </>
  );
}

export default observer(TeamspacePageDetailsPage);
