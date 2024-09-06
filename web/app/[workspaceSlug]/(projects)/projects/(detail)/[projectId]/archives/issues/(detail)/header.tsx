"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { ArchiveIcon, Breadcrumbs, LayersIcon, Header } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { IssueDetailQuickActions } from "@/components/issues";
// constants
import { ISSUE_DETAILS } from "@/constants/fetch-keys";
// hooks
import { useProject } from "@/hooks/store";
// services
import { IssueArchiveService } from "@/services/issue";

const issueArchiveService = new IssueArchiveService();

export const ProjectArchivedIssueDetailsHeader = observer(() => {
  // router
  const { workspaceSlug, projectId, archivedIssueId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && archivedIssueId ? ISSUE_DETAILS(archivedIssueId as string) : null,
    workspaceSlug && projectId && archivedIssueId
      ? () =>
          issueArchiveService.retrieveArchivedIssue(
            workspaceSlug as string,
            projectId as string,
            archivedIssueId as string
          )
      : null
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader}>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects`}
                label={currentProjectDetails?.name ?? "Project"}
                icon={
                  currentProjectDetails && (
                    <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                      <Logo logo={currentProjectDetails?.logo_props} size={16} />
                    </span>
                  )
                }
              />
            }
          />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                label="Archives"
                icon={<ArchiveIcon className="h-4 w-4 text-custom-text-300" />}
              />
            }
          />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                label="Issues"
                icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
              />
            }
          />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                label={
                  currentProjectDetails && issueDetails
                    ? `${currentProjectDetails.identifier}-${issueDetails.sequence_id}`
                    : ""
                }
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <IssueDetailQuickActions
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          issueId={archivedIssueId.toString()}
        />
      </Header.RightItem>
    </Header>
  );
});
