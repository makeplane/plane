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

import { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane imports
import { getButtonStyling } from "@plane/propel/button";
import type { TSearchEntityRequestPayload, TWebhookConnectionQueryParams } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import type { TPageRootConfig, TPageRootHandlers } from "@/components/pages/editor/page-root";
import { PageRoot } from "@/components/pages/editor/page-root";
// hooks
import { useEditorConfig } from "@/hooks/editor/use-editor-config";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
import { WorkspaceService } from "@/services/workspace.service";
import { WorkspacePageService } from "@/services/page/workspace-page.service";
import { WorkspacePageVersionService } from "@/services/page/workspace-page-version.service";
import type { Route } from "./+types/page";
// services
const workspaceService = new WorkspaceService();
const workspacePageService = new WorkspacePageService();
const workspacePageVersionService = new WorkspacePageVersionService();

const storeType = EPageStoreType.WORKSPACE;

function PageDetailsPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, pageId } = params;
  // flag
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { createPage, fetchPageDetails } = usePageStore(storeType);
  const page = usePage({
    pageId,
    storeType,
  });
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = useMemo(() => getWorkspaceBySlug(workspaceSlug)?.id ?? "", [getWorkspaceBySlug, workspaceSlug]);
  const { canCurrentUserAccessPage, id, name, updateDescription } = page ?? {};
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) => await workspaceService.searchEntity(workspaceSlug ?? "", payload),
    [workspaceSlug]
  );
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    pageId ? `PAGE_DETAILS_${pageId}` : null,
    pageId ? () => fetchPageDetails(pageId.toString()) : null,
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
      fetchAllVersions: async (pageId) => await workspacePageVersionService.fetchAllVersions(workspaceSlug, pageId),
      fetchDescriptionBinary: async () => {
        if (!id) return;
        return await workspacePageService.fetchDescriptionBinary(workspaceSlug, id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) =>
        await workspacePageVersionService.fetchVersionById(workspaceSlug, pageId, versionId),
      restoreVersion: async (pageId, versionId) => {
        await workspacePageVersionService.restoreVersion(workspaceSlug, pageId, versionId);
      },
      getRedirectionLink: (pageId) => {
        if (pageId) {
          return `/${workspaceSlug}/wiki/${pageId}`;
        } else {
          return `/${workspaceSlug}/wiki`;
        }
      },
      updateDescription: updateDescription ?? (async () => {}),
    }),
    [createPage, fetchEntityCallback, id, updateDescription, workspaceSlug]
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
      documentType: "workspace_page",
      workspaceSlug,
    }),
    [workspaceSlug]
  );

  useEffect(() => {
    if (page?.deleted_at && page?.id) {
      router.push(pageRootHandlers.getRedirectionLink());
    }
  }, [page?.deleted_at, page?.id, router, pageRootHandlers]);

  if ((!page || !id) && !pageDetailsError)
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );

  if (pageDetailsError || !canCurrentUserAccessPage)
    return (
      <div className="size-full flex flex-col items-center justify-center">
        <h3 className="text-16 font-semibold text-center">Page not found</h3>
        <p className="text-13 text-secondary text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link href={`/${workspaceSlug}/pages`} className={cn(getButtonStyling("secondary", "base"), "mt-5")}>
          View other Pages
        </Link>
      </div>
    );

  if (!page) return null;

  return (
    <>
      <PageHead title={name} />
      <div className="flex h-full flex-col justify-between">
        <div className="size-full flex-shrink-0 flex flex-col overflow-hidden">
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

export default observer(PageDetailsPage);
