"use client";

import { useCallback, useMemo } from "react";
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
// plane web imports
import { EpicPeekOverview } from "@/plane-web/components/epics/peek-overview";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
import { WorkspaceService } from "@/plane-web/services";
import { TeamspacePageVersionService } from "@/plane-web/services/teamspace/teamspace-page-version.service";
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
const workspaceService = new WorkspaceService();
const teamspacePageService = new TeamspacePageService();
const teamspacePageVersionService = new TeamspacePageVersionService();

const storeType = EPageStoreType.TEAMSPACE;

const TeamspacePageDetailsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId, pageId: routerPageId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  const pageId = routerPageId?.toString();
  // store hooks
  const { createPage, fetchPageDetails } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : "";
  const { id, name, updateDescription } = page ?? {};
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
        ...payload,
        team_id: teamspaceId?.toString() ?? "",
      }),
    [teamspaceId, workspaceSlug]
  );
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    workspaceSlug && teamspaceId && pageId ? `TEAM_PAGE_DETAILS_${pageId}` : null,
    workspaceSlug && teamspaceId && pageId ? () => fetchPageDetails(teamspaceId, pageId) : null,
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
        if (!workspaceSlug || !teamspaceId) return;
        return await teamspacePageVersionService.fetchAllVersions(workspaceSlug, teamspaceId, pageId);
      },
      fetchDescriptionBinary: async () => {
        if (!workspaceSlug || !teamspaceId || !id) return;
        return await teamspacePageService.fetchDescriptionBinary(workspaceSlug, teamspaceId, id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) => {
        if (!workspaceSlug || !teamspaceId) return;
        return await teamspacePageVersionService.fetchVersionById(workspaceSlug, teamspaceId, pageId, versionId);
      },
      getRedirectionLink: (pageId) => `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}`,
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
        workspaceId,
        workspaceSlug,
      }),
    }),
    [getEditorFileHandlers, id, uploadEditorAsset, workspaceId, workspaceSlug]
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
        <h3 className="text-lg font-semibold text-center">Page not found</h3>
        <p className="text-sm text-custom-text-200 text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link
          href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages`}
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
            workspaceSlug={workspaceSlug}
          />
          <IssuePeekOverview />
          <EpicPeekOverview />
        </div>
      </div>
    </>
  );
});

export default TeamspacePageDetailsPage;
