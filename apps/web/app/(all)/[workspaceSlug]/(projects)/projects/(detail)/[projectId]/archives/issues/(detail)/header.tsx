import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { ArchiveIcon, WorkItemsIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { IssueDetailQuickActions } from "@/components/issues/issue-detail/issue-detail-quick-actions";
// constants
import { ISSUE_DETAILS } from "@/constants/fetch-keys";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs/project";
// services
import { IssueService } from "@/services/issue";

const issueService = new IssueService();

export const ProjectArchivedIssueDetailsHeader = observer(function ProjectArchivedIssueDetailsHeader() {
  // router
  const { workspaceSlug, projectId, archivedIssueId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && archivedIssueId ? ISSUE_DETAILS(archivedIssueId.toString()) : null,
    workspaceSlug && projectId && archivedIssueId
      ? () => issueService.retrieve(workspaceSlug.toString(), projectId.toString(), archivedIssueId.toString())
      : null
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <ProjectBreadcrumb workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                label="Archives"
                icon={<ArchiveIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                label="Work items"
                icon={<WorkItemsIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
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
