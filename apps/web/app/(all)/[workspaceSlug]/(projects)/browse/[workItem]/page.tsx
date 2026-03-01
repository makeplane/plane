/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { Loader } from "@plane/ui";
// assets
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import { WorkItemDetailRoot } from "@/components/browse/workItem-detail";
import { IntakeDetailViewRoot } from "@/components/intake/detail-root";
import { useWorkItemCommentOperations } from "@/components/issues/issue-detail/issue-activity/helper";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkItemDetailRevalidation } from "@/lib/socket/hooks/work-item-detail";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// plane web imports
import { useWorkItemProperties } from "@/plane-web/hooks/use-issue-properties";
// types
import type { Route } from "./+types/page";

export const IssueDetailsPage = observer(function IssueDetailsPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, workItem } = params;
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const { t } = useTranslation();
  const {
    fetchWorkItemWithIdentifier,
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById, getProjectByIdentifier } = useProject();
  const { toggleIssueDetailSidebar, issueDetailSidebarCollapsed } = useAppTheme();

  // fetching issue details
  const {
    data,
    isLoading,
    error,
    mutate: mutateWorkItemDetail,
  } = useSWR<TIssue, Error>(["workItemDetail", workspaceSlug, workItem], () =>
    fetchWorkItemWithIdentifier(workspaceSlug, workItem)
  );

  // derived values
  const [projectIdentifier] = workItem?.toString()?.split("-");
  const projectDetails = getProjectByIdentifier(projectIdentifier);
  const workItemId = data?.id;
  const projectId = data?.project_id ?? projectDetails?.id ?? undefined;
  const workItemDetail = workItemId ? getIssueById(workItemId) : undefined;
  const project = (workItemDetail?.project_id && getProjectById(workItemDetail?.project_id)) || undefined;
  const workItemLoader = !workItemDetail || isLoading;
  const pageTitle =
    project && workItemDetail
      ? `${project?.identifier}-${workItemDetail?.sequence_id} ${workItemDetail?.name}`
      : undefined;
  const workItemServiceType = workItemDetail?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES;

  useWorkItemProperties(projectId, workspaceSlug, workItemId, workItemServiceType);

  const {
    activity: { fetchActivities },
    comment: { fetchComments },
    subIssues: { fetchSubIssues },
    relation: { fetchRelations },
  } = useIssueDetail(workItemServiceType);
  const activityOperations = useWorkItemCommentOperations(workspaceSlug, projectId, workItemId);

  const { mutate: mutateWorkItemActivity } = useSWR(
    projectId && workItemId ? ["workItemActivity", projectId, workItemId] : null,
    projectId && workItemId ? () => fetchActivities(workspaceSlug, projectId, workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  const { mutate: mutateWorkItemComments } = useSWR(
    projectId && workItemId ? ["workItemComments", projectId, workItemId] : null,
    projectId && workItemId ? () => fetchComments(workspaceSlug, projectId, workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  const { mutate: mutateWorkItemSubWorkItems } = useSWR(
    projectId && workItemId ? ["workItemSubWorkItems", projectId, workItemId] : null,
    projectId && workItemId ? () => fetchSubIssues(workspaceSlug, projectId, workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  const { mutate: mutateWorkItemRelations } = useSWR(
    projectId && workItemId ? ["workItemRelations", projectId, workItemId] : null,
    projectId && workItemId ? () => fetchRelations(workspaceSlug, projectId, workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  useWorkItemDetailRevalidation({
    workItemId,
    entityType: workItemDetail?.is_epic ? "epic" : "workitem",
    mutateFn: {
      detail: mutateWorkItemDetail,
      comments: mutateWorkItemComments,
      commentReplies: activityOperations?.replyOperations?.fetchReplies,
      relations: mutateWorkItemRelations,
      subWorkItems: mutateWorkItemSubWorkItems,
      activity: mutateWorkItemActivity,
    },
  });

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

  if (error && !isLoading) {
    return (
      <EmptyState
        image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
        title={t("issue.empty_state.issue_detail.title")}
        description={t("issue.empty_state.issue_detail.description")}
        primaryButton={{
          text: t("issue.empty_state.issue_detail.primary_button.text"),
          onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues/`),
        }}
      />
    );
  }

  if (workItemLoader) {
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
      {workspaceSlug && projectId && workItemId && (
        <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
          {data?.is_intake ? (
            <IntakeDetailViewRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              inboxIssueId={workItemId || undefined}
            />
          ) : (
            <WorkItemDetailRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              workItemId={workItemId}
              workItem={workItemDetail}
            />
          )}
        </ProjectAuthWrapper>
      )}
    </>
  );
});

export default IssueDetailsPage;
