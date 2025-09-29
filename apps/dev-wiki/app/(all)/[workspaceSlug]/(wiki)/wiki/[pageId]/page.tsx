"use client";

import { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EFileAssetType, TSearchEntityRequestPayload, TWebhookConnectionQueryParams } from "@plane/types";
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
// import { IssuePeekOverview } from "@/components/issues";
import { PageRoot, TPageRootConfig, TPageRootHandlers } from "@/components/pages";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useEditorAsset, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
// import { EpicPeekOverview } from "@/plane-web/components/epics";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
import { WorkspaceService } from "@/plane-web/services";
import { WorkspacePageService, WorkspacePageVersionService } from "@/plane-web/services/page";
// services
const workspaceService = new WorkspaceService();
const workspacePageService = new WorkspacePageService();
const workspacePageVersionService = new WorkspacePageVersionService();

const storeType = EPageStoreType.WORKSPACE;

const PageDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, pageId } = useParams();
  // flag
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { createPage, fetchPageDetails, isNestedPagesEnabled } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = useMemo(
    () => (workspaceSlug ? (getWorkspaceBySlug(workspaceSlug?.toString())?.id ?? "") : ""),
    [getWorkspaceBySlug, workspaceSlug]
  );
  const { canCurrentUserAccessPage, id, name, updateDescription } = page ?? {};

  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", payload),
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
      fetchAllVersions: async (pageId) => {
        if (!workspaceSlug) return;
        return await workspacePageVersionService.fetchAllVersions(workspaceSlug.toString(), pageId);
      },
      fetchDescriptionBinary: async () => {
        if (!workspaceSlug || !id) return;
        return await workspacePageService.fetchDescriptionBinary(workspaceSlug.toString(), id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) => {
        if (!workspaceSlug) return;
        return await workspacePageVersionService.fetchVersionById(workspaceSlug.toString(), pageId, versionId);
      },
      getRedirectionLink: (pageId) => {
        if (pageId) {
          return `/${workspaceSlug}/pages/${pageId}`;
        } else {
          return `/${workspaceSlug}/pages`;
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
            workspaceSlug: workspaceSlug?.toString() ?? "",
          });
          return asset_id;
        },
        workspaceId,
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }),
    }),
    [getEditorFileHandlers, id, uploadEditorAsset, workspaceId, workspaceSlug]
  );

  const webhookConnectionParams: TWebhookConnectionQueryParams = useMemo(
    () => ({
      documentType: "workspace_page",
      workspaceSlug: workspaceSlug?.toString() ?? "",
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

  if (!isNestedPagesEnabled(workspaceSlug?.toString()) && page?.parent_id)
    return (
      <div className="size-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-center">Please upgrade your plan to view this nested page</h3>
        <p className="text-sm text-custom-text-200 text-center mt-3">
          Please upgrade your plan to view this nested page
        </p>
        <Link href={`/${workspaceSlug}/pages`} className={cn(getButtonStyling("neutral-primary", "md"), "mt-5")}>
          View other Pages
        </Link>
      </div>
    );

  if (pageDetailsError || !canCurrentUserAccessPage)
    return (
      <div className="size-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-center">Page not found</h3>
        <p className="text-sm text-custom-text-200 text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link href={`/${workspaceSlug}/pages`} className={cn(getButtonStyling("neutral-primary", "md"), "mt-5")}>
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
            workspaceSlug={workspaceSlug.toString()}
          />
          {/* <IssuePeekOverview /> */}
          {/* <EpicPeekOverview /> */}
        </div>
      </div>
    </>
  );
});

export default PageDetailsPage;
