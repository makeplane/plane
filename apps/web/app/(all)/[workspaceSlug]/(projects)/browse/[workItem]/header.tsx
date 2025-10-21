"use client";

import { observer } from "mobx-react";
// plane imports
import { EProjectFeatureKey } from "@plane/constants";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { IssueDetailQuickActions } from "@/components/issues/issue-detail/issue-detail-quick-actions";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

type ProjectIssueDetailsHeaderProps = {
  workspaceSlug: string;
  workItem: string;
};

export const ProjectIssueDetailsHeader = observer(({ workspaceSlug, workItem }: ProjectIssueDetailsHeaderProps) => {
  // router
  const router = useAppRouter();
  // store hooks
  const { getProjectById, loader } = useProject();
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const issueId = getIssueIdByIdentifier(workItem);
  const issueDetails = issueId ? getIssueById(issueId) : undefined;
  const projectId = issueDetails ? issueDetails?.project_id : undefined;
  const projectDetails = projectId ? getProjectById(projectId) : undefined;

  if (!projectId || !issueId) return null;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            featureKey={EProjectFeatureKey.WORK_ITEMS}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={projectDetails && issueDetails ? `${projectDetails.identifier}-${issueDetails.sequence_id}` : ""}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        {projectId && issueId && (
          <IssueDetailQuickActions
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            issueId={issueId?.toString()}
          />
        )}
      </Header.RightItem>
    </Header>
  );
});
