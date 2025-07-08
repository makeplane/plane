"use client";

import { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane types
import { EFileAssetType, TSearchEntityRequestPayload, TWebhookConnectionQueryParams } from "@plane/types";
// plane ui
import { getButtonStyling } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { IssuePeekOverview } from "@/components/issues";
import { PageRoot, TPageRootConfig, TPageRootHandlers } from "@/components/pages";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useEditorAsset, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { type TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
// plane web hooks
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// services
import { ProjectPageService, ProjectPageVersionService } from "@/services/page";

const workspaceService = new WorkspaceService();
const projectPageService = new ProjectPageService();
const projectPageVersionService = new ProjectPageVersionService();

const storeType = EPageStoreType.PROJECT;

const PageDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, pageId } = useParams();
  // store hooks
  const { createPage, fetchPageDetails, getOrFetchPageInstance, removePageInstance } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "") : "";
  const { canCurrentUserAccessPage, id, name, updateDescription } = page ?? {};
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
        ...payload,
        project_id: projectId?.toString() ?? "",
      }),
    [projectId, workspaceSlug]
  );
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    workspaceSlug && projectId && pageId ? `PAGE_DETAILS_${pageId}` : null,
    workspaceSlug && projectId && pageId ? () => fetchPageDetails(projectId?.toString(), pageId.toString()) : null,
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
        if (!workspaceSlug || !projectId) return;
        return await projectPageVersionService.fetchAllVersions(workspaceSlug.toString(), projectId.toString(), pageId);
      },
      fetchDescriptionBinary: async () => {
        if (!workspaceSlug || !projectId || !id) return;
        return await projectPageService.fetchDescriptionBinary(workspaceSlug.toString(), projectId.toString(), id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) => {
        if (!workspaceSlug || !projectId) return;
        return await projectPageVersionService.fetchVersionById(
          workspaceSlug.toString(),
          projectId.toString(),
          pageId,
          versionId
        );
      },
      getRedirectionLink: (pageId) => `/${workspaceSlug}/projects/${projectId}/pages/${pageId}`,
      updateDescription: updateDescription ?? (async () => {}),
    }),
    [createPage, fetchEntityCallback, id, projectId, updateDescription, workspaceSlug]
  );
  // page root config
  const pageRootConfig: TPageRootConfig = useMemo(
    () => ({
      fileHandler: getEditorFileHandlers({
        projectId: projectId?.toString() ?? "",
        uploadFile: async (blockId, file) => {
          const { asset_id } = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: id ?? "",
              entity_type: EFileAssetType.PAGE_DESCRIPTION,
            },
            file,
            projectId: projectId?.toString() ?? "",
            workspaceSlug: workspaceSlug?.toString() ?? "",
          });
          return asset_id;
        },
        workspaceId,
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }),
    }),
    [getEditorFileHandlers, id, projectId, uploadEditorAsset, workspaceId, workspaceSlug]
  );

  const webhookConnectionParams: TWebhookConnectionQueryParams = useMemo(
    () => ({
      documentType: "project_page",
      projectId: projectId?.toString() ?? "",
      workspaceSlug: workspaceSlug?.toString() ?? "",
    }),
    [projectId, workspaceSlug]
  );

  // Custom event handlers specific to project pages
  const customRealtimeEventHandlers: TCustomEventHandlers = useMemo(
    () => ({
      moved: async ({ pageIds, data }) => {
        if (data.new_project_id && data.new_page_id) {
          // For project pages, handle the move to a different project
          const newProjectId = data.new_project_id;
          const newPageId = data.new_page_id;

          // remove the old page instance from the store
          if (pageIds.includes(page?.id ?? "")) {
            removePageInstance(page?.id ?? "");
          }

          // get the new page instance from the store
          await getOrFetchPageInstance({ pageId: newPageId, projectId: newProjectId });

          router.replace(`/${workspaceSlug}/projects/${newProjectId}/pages/${newPageId}`);
        }
      },
    }),
    [workspaceSlug, router, getOrFetchPageInstance, removePageInstance, page?.id]
  );

  useEffect(() => {
    if (page?.deleted_at && page?.id) {
      router.back();
    }
  }, [page?.deleted_at, page?.id, router]);

  if ((!page || !id) && !pageDetailsError)
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );

  if (pageDetailsError || !canCurrentUserAccessPage)
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-center">Page not found</h3>
        <p className="text-sm text-custom-text-200 text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/pages`}
          className={cn(getButtonStyling("neutral-primary", "md"), "mt-5")}
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
            projectId={projectId?.toString()}
            workspaceSlug={workspaceSlug?.toString() ?? ""}
            customRealtimeEventHandlers={customRealtimeEventHandlers}
          />
          <IssuePeekOverview />
        </div>
      </div>
    </>
  );
});

export default PageDetailsPage;
