"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane types
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
import { useProjectPage, useProjectPages, useWorkspace } from "@/hooks/store";
import { useEditorMention } from "@/hooks/use-editor-mention";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";
// services
import { FileService } from "@/services/file.service";
import { ProjectPageService, ProjectPageVersionService } from "@/services/page";
import { ProjectService } from "@/services/project";
const fileService = new FileService();
const projectPageService = new ProjectPageService();
const projectPageVersionService = new ProjectPageVersionService();
const projectService = new ProjectService();

const PageDetailsPage = observer(() => {
  const { workspaceSlug, projectId, pageId } = useParams();
  // store hooks
  const { createPage, getPageById } = useProjectPages();
  const page = useProjectPage(pageId?.toString() ?? "");
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "") : "";
  const { id, name, updateDescription } = page;
  // issue-embed
  const { issueEmbedProps } = useIssueEmbed(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "");
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: async (payload) =>
      await projectService.searchEntity(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "", payload),
  });
  // file size
  const { maxFileSize } = useFileSize();
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    workspaceSlug && projectId && pageId ? `PAGE_DETAILS_${pageId}` : null,
    workspaceSlug && projectId && pageId
      ? () => getPageById(workspaceSlug?.toString(), projectId?.toString(), pageId.toString())
      : null,
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
        if (!workspaceSlug || !projectId || !page.id) return;
        return await projectPageService.fetchDescriptionBinary(workspaceSlug.toString(), projectId.toString(), page.id);
      },
      fetchMentions,
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
      updateDescription,
    }),
    [createPage, fetchMentions, page.id, projectId, updateDescription, workspaceSlug]
  );
  // page root config
  const pageRootConfig: TPageRootConfig = useMemo(
    () => ({
      fileHandler: getEditorFileHandlers({
        maxFileSize,
        projectId: projectId?.toString() ?? "",
        uploadFile: async (file) => {
          const { asset_id } = await fileService.uploadProjectAsset(
            workspaceSlug?.toString() ?? "",
            projectId?.toString() ?? "",
            {
              entity_identifier: id ?? "",
              entity_type: EFileAssetType.PAGE_DESCRIPTION,
            },
            file
          );
          return asset_id;
        },
        workspaceId,
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }),
      issueEmbedConfig: issueEmbedProps,
      webhookConnectionParams: {
        documentType: "project_page",
        projectId: projectId?.toString() ?? "",
        workspaceSlug: workspaceSlug?.toString() ?? "",
      },
    }),
    [id, issueEmbedProps, maxFileSize, projectId, workspaceId, workspaceSlug]
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
          href={`/${workspaceSlug}/projects/${projectId}/pages`}
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
          <PageRoot
            config={pageRootConfig}
            handlers={pageRootHandlers}
            page={page}
            workspaceSlug={workspaceSlug?.toString() ?? ""}
          />
          <IssuePeekOverview />
        </div>
      </div>
    </>
  );
});

export default PageDetailsPage;
