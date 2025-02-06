"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane types
import { TSearchEntityRequestPayload } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// plane ui
import { getButtonStyling } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { IssuePeekOverview } from "@/components/issues";
import { PageRoot, TPageRootConfig, TPageRootHandlers } from "@/components/pages";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web hooks
import { useTeamspacePage, useTeamspacePages } from "@/plane-web/hooks/store";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// services
import { WorkspaceService } from "@/plane-web/services";
import { TeamspacePageVersionService } from "@/plane-web/services/teamspace/teamspace-page-version.service";
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
import { FileService } from "@/services/file.service";
const workspaceService = new WorkspaceService();
const fileService = new FileService();
const teamspacePageService = new TeamspacePageService();
const teamspacePageVersionService = new TeamspacePageVersionService();

const TeamspacePageDetailsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId, pageId: routerPageId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamspaceId = routerTeamSpaceId?.toString();
  const pageId = routerPageId?.toString();
  // store hooks
  const { createPage, fetchTeamspacePageDetails } = useTeamspacePages();
  const page = useTeamspacePage(teamspaceId, pageId);
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : "";
  const { id, name, updateDescription } = page;
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
        ...payload,
        team_id: teamspaceId?.toString() ?? "",
      }),
    [teamspaceId, workspaceSlug]
  );
  // file size
  const { maxFileSize } = useFileSize();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    workspaceSlug && teamspaceId && pageId ? `TEAM_PAGE_DETAILS_${pageId}` : null,
    workspaceSlug && teamspaceId && pageId ? () => fetchTeamspacePageDetails(workspaceSlug, teamspaceId, pageId) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  // page root handlers
  const pageRootHandlers: TPageRootHandlers = useMemo(
    () => ({
      create: async (payload) => await createPage(workspaceSlug, teamspaceId, payload),
      fetchAllVersions: async (pageId) => {
        if (!workspaceSlug || !teamspaceId) return;
        return await teamspacePageVersionService.fetchAllVersions(workspaceSlug, teamspaceId, pageId);
      },
      fetchDescriptionBinary: async () => {
        if (!workspaceSlug || !teamspaceId || !page.id) return;
        return await teamspacePageService.fetchDescriptionBinary(workspaceSlug, teamspaceId, page.id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) => {
        if (!workspaceSlug || !teamspaceId) return;
        return await teamspacePageVersionService.fetchVersionById(workspaceSlug, teamspaceId, pageId, versionId);
      },
      getRedirectionLink: (pageId) => `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}`,
      updateDescription,
    }),
    [createPage, fetchEntityCallback, page.id, teamspaceId, updateDescription, workspaceSlug]
  );
  // page root config
  const pageRootConfig: TPageRootConfig = useMemo(
    () => ({
      fileHandler: getEditorFileHandlers({
        maxFileSize,
        uploadFile: async (file) => {
          const { asset_id } = await fileService.uploadWorkspaceAsset(
            workspaceSlug,
            {
              entity_identifier: id ?? "",
              entity_type: EFileAssetType.PAGE_DESCRIPTION,
            },
            file
          );
          return asset_id;
        },
        workspaceId,
        workspaceSlug,
      }),
      webhookConnectionParams: {
        documentType: "teamspace_page",
        teamspaceId,
        workspaceSlug,
      },
    }),
    [id, maxFileSize, teamspaceId, workspaceId, workspaceSlug]
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

  return (
    <>
      <PageHead title={name} />
      <div className="flex h-full flex-col justify-between">
        <div className="relative h-full w-full flex-shrink-0 flex flex-col overflow-hidden">
          <PageRoot config={pageRootConfig} handlers={pageRootHandlers} page={page} workspaceSlug={workspaceSlug} />
          <IssuePeekOverview />
        </div>
      </div>
    </>
  );
});

export default TeamspacePageDetailsPage;
