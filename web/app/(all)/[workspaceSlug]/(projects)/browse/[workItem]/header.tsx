"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EProjectFeatureKey } from "@plane/constants";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { IssueDetailQuickActions } from "@/components/issues";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

export const ProjectIssueDetailsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, workItem } = useParams();
  // store hooks
  const { getProjectById, loader } = useProject();
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const issueId = getIssueIdByIdentifier(workItem?.toString());
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;
  const projectId = issueDetails ? issueDetails?.project_id : undefined;
  const projectDetails = projectId ? getProjectById(projectId?.toString()) : undefined;

  if (!workspaceSlug || !projectId || !issueId) return null;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
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
