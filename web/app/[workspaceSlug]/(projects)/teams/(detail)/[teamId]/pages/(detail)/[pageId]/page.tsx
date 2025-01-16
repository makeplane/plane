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
import { useTeamPage, useTeamPages } from "@/plane-web/hooks/store";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// services
import { WorkspaceService } from "@/plane-web/services";
import { TeamPageVersionService } from "@/plane-web/services/teams/team-page-version.service";
import { TeamPageService } from "@/plane-web/services/teams/team-pages.service";
import { FileService } from "@/services/file.service";
const workspaceService = new WorkspaceService();
const fileService = new FileService();
const teamPageService = new TeamPageService();
const teamPageVersionService = new TeamPageVersionService();

const TeamPageDetailsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId, pageId: routerPageId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const teamId = routerTeamId?.toString();
  const pageId = routerPageId?.toString();
  // store hooks
  const { createPage, fetchTeamPageDetails } = useTeamPages();
  const page = useTeamPage(teamId, pageId);
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : "";
  const { id, name, updateDescription } = page;
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
        ...payload,
        team_id: teamId?.toString() ?? "",
      }),
    [teamId, workspaceSlug]
  );
  // file size
  const { maxFileSize } = useFileSize();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    workspaceSlug && teamId && pageId ? `TEAM_PAGE_DETAILS_${pageId}` : null,
    workspaceSlug && teamId && pageId ? () => fetchTeamPageDetails(workspaceSlug, teamId, pageId) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  // page root handlers
  const pageRootHandlers: TPageRootHandlers = useMemo(
    () => ({
      create: async (payload) => await createPage(workspaceSlug, teamId, payload),
      fetchAllVersions: async (pageId) => {
        if (!workspaceSlug || !teamId) return;
        return await teamPageVersionService.fetchAllVersions(workspaceSlug, teamId, pageId);
      },
      fetchDescriptionBinary: async () => {
        if (!workspaceSlug || !teamId || !page.id) return;
        return await teamPageService.fetchDescriptionBinary(workspaceSlug, teamId, page.id);
      },
      fetchEntity: fetchEntityCallback,
      fetchVersionDetails: async (pageId, versionId) => {
        if (!workspaceSlug || !teamId) return;
        return await teamPageVersionService.fetchVersionById(workspaceSlug, teamId, pageId, versionId);
      },
      getRedirectionLink: (pageId) => `/${workspaceSlug}/teams/${teamId}/pages/${pageId}`,
      updateDescription,
    }),
    [createPage, fetchEntityCallback, page.id, teamId, updateDescription, workspaceSlug]
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
        workspaceSlug: workspaceSlug,
      }),
      webhookConnectionParams: {
        documentType: "team_page",
        teamId: teamId,
        workspaceSlug: workspaceSlug,
      },
    }),
    [id, maxFileSize, teamId, workspaceId, workspaceSlug]
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
          href={`/${workspaceSlug}/teams/${teamId}/pages`}
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

export default TeamPageDetailsPage;
