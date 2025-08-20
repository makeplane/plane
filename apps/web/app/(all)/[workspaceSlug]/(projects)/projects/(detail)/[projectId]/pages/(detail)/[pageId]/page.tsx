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
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { PageRoot, TPageRootConfig, TPageRootHandlers } from "@/components/pages/editor/page-root";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import { type TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
// plane web imports
import { EpicPeekOverview } from "@/plane-web/components/epics";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
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
  const { createPage, fetchPageDetails, getOrFetchPageInstance, removePageInstance, isNestedPagesEnabled } =
    usePageStore(storeType);
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
      getRedirectionLink: (pageId) => {
        if (pageId) {
          return `/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;
        } else {
          return `/${workspaceSlug}/projects/${projectId}/pages`;
        }
      },
      updateDescription: updateDescription ?? (async () => {}),
    }),
    [createPage, fetchEntityCallback, id, updateDescription, workspaceSlug, projectId]
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
            workspaceSlug: workspaceSlug?.toString() ?? "",
            file,
            projectId: projectId?.toString() ?? "",
          });
          return asset_id;
        },
        workspaceId,
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }),
    }),
    [getEditorFileHandlers, id, uploadEditorAsset, projectId, workspaceId, workspaceSlug]
  );

  const webhookConnectionParams: TWebhookConnectionQueryParams = useMemo(
    () => ({
      documentType: "project_page",
      projectId: projectId?.toString() ?? "",
      workspaceSlug: workspaceSlug?.toString() ?? "",
    }),
    [workspaceSlug, projectId]
  );

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
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/pages`}
          className={cn(getButtonStyling("neutral-primary", "md"), "mt-5")}
        >
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
        <div className="relative size-full flex-shrink-0 flex flex-col overflow-hidden">
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
          <EpicPeekOverview />
        </div>
      </div>
    </>
  );
});

export default PageDetailsPage;
