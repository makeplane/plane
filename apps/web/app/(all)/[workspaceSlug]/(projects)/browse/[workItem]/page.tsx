/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
import { Loader } from "@plane/blocks/skeleton";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// plane web imports
import { useWorkItemProperties } from "@/hooks/use-issue-properties";
import { WorkItemDetailRoot } from "@/components/browse/workItem-detail";

import type { Route } from "./+types/page";

export const IssueDetailsPage = observer(function IssueDetailsPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, workItem } = params;
  // store hooks
  const { t } = useTranslation();
  const {
    fetchIssueWithIdentifier,
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById, getProjectByIdentifier } = useProject();
  const { toggleIssueDetailSidebar, issueDetailSidebarCollapsed } = useAppTheme();

  const [projectIdentifier, sequence_id] = workItem.split("-");

  // fetching issue details
  const { data, isLoading, error } = useSWR<TIssue, Error & { status?: number }>(
    `ISSUE_DETAIL_${workspaceSlug}_${projectIdentifier}_${sequence_id}`,
    () => fetchIssueWithIdentifier(workspaceSlug.toString(), projectIdentifier, sequence_id)
  );

  // derived values
  const projectDetails = getProjectByIdentifier(projectIdentifier);
  const issueId = data?.id;
  const projectId = data?.project_id ?? projectDetails?.id ?? "";
  const issue = getIssueById(issueId?.toString() || "") || undefined;
  const project = (issue?.project_id && getProjectById(issue?.project_id)) || undefined;
  const issueLoader = !issue || isLoading;
  const pageTitle = project && issue ? `${project?.identifier}-${issue?.sequence_id} ${issue?.name}` : undefined;

  useWorkItemProperties(
    projectId,
    workspaceSlug.toString(),
    issueId,
    issue?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES
  );

  useEffect(() => {
    const handleToggleIssueDetailSidebar = () => {
      if (window && window.innerWidth < 768) {
        toggleIssueDetailSidebar(true);
      }
      if (window && issueDetailSidebarCollapsed && window.innerWidth >= 768) {
        toggleIssueDetailSidebar(false);
      }
    };
    window.addEventListener("resize", handleToggleIssueDetailSidebar);
    handleToggleIssueDetailSidebar();
    return () => window.removeEventListener("resize", handleToggleIssueDetailSidebar);
  }, [issueDetailSidebarCollapsed, toggleIssueDetailSidebar]);

  useEffect(() => {
    if (data?.is_intake) {
      router.push(`/${workspaceSlug}/projects/${data.project_id}/intake/?currentTab=open&inboxIssueId=${data?.id}`);
    }
  }, [workspaceSlug, data, router]);

  if (error && !isLoading && error.status === 403) {
    return (
      <EmptyStateDetailed
        align="center"
        assetKey="no-access"
        assetClassName="size-40"
        title={t("issue.empty_state.no_access.title")}
        description={t("issue.empty_state.no_access.description")}
        actions={[
          {
            label: t("issue.empty_state.issue_detail.primary_button.text"),
            variant: "primary",
            onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues/`),
          },
        ]}
      />
    );
  }

  if (error && !isLoading) {
    return (
      <EmptyStateDetailed
        align="center"
        assetKey="work-item"
        assetClassName="size-40"
        title={t("issue.empty_state.issue_detail.title")}
        description={t("issue.empty_state.issue_detail.description")}
        actions={[
          {
            label: t("issue.empty_state.issue_detail.primary_button.text"),
            variant: "primary",
            onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues/`),
          },
        ]}
      />
    );
  }

  if (issueLoader) {
    return (
      <Loader className="flex h-full gap-5 p-5">
        <div className="basis-2/3 space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
          <Loader.Item height="15px" width="60%" />
          <Loader.Item height="15px" width="40%" />
        </div>
        <div className="basis-1/3 space-y-3">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </div>
      </Loader>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      {workspaceSlug && projectId && issueId && (
        <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
          <WorkItemDetailRoot
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            issueId={issueId.toString()}
            issue={issue}
          />
        </ProjectAuthWrapper>
      )}
    </>
  );
});

export default IssueDetailsPage;
