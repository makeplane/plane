"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Breadcrumbs, LayersIcon, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { IssueDetailQuickActions } from "@/components/issues";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";

export const ProjectIssueDetailsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, issueId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader}>
            <ProjectBreadcrumb />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/issues`}
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
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <IssueDetailQuickActions
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          issueId={issueId.toString()}
        />
      </Header.RightItem>
    </Header>
  );
});
