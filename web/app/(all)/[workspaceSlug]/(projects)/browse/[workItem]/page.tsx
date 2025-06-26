"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane imports
import { EIssueServiceType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// components
import { JoinProject } from "@/components/auth-screens";
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
import { IssueDetailRoot } from "@/components/issues";
// hooks
import { useAppTheme, useIssueDetail, useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web components
import { EpicDetailRoot } from "@/plane-web/components/epics/details/root";
import { useWorkItemProperties } from "@/plane-web/hooks/use-issue-properties";
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";
// assets
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";

const IssueDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, workItem } = useParams();
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const { t } = useTranslation();
  const {
    fetchIssueWithIdentifier,
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById, getProjectByIdentifier } = useProject();
  const { toggleIssueDetailSidebar, issueDetailSidebarCollapsed } = useAppTheme();

  const projectIdentifier = workItem?.toString().split("-")[0];
  const sequence_id = workItem?.toString().split("-")[1];

  // fetching issue details
  const { data, isLoading, error } = useSWR(
    workspaceSlug && workItem ? `ISSUE_DETAIL_${workspaceSlug}_${projectIdentifier}_${sequence_id}` : null,
    workspaceSlug && workItem
      ? () => fetchIssueWithIdentifier(workspaceSlug.toString(), projectIdentifier, sequence_id)
      : null
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

  const renderPrivateProjectEmptyState = error && error.type === 0;

  return (
    <>
      <PageHead title={pageTitle} />
      {renderPrivateProjectEmptyState ? (
        <JoinProject projectId={projectId} isPrivateProject />
      ) : (
        <ProjectAuthWrapper workspaceSlug={workspaceSlug?.toString()} projectId={projectId}>
          {error ? (
            <EmptyState
              image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
              title={t("issue.empty_state.issue_detail.title")}
              description={t("issue.empty_state.issue_detail.description")}
              primaryButton={{
                text: t("issue.empty_state.issue_detail.primary_button.text"),
                onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues/`),
              }}
            />
          ) : issueLoader ? (
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
          ) : (
            workspaceSlug &&
            projectId &&
            issueId && (
              <>
                {issue?.is_epic ? (
                  <>
                    <EpicDetailRoot
                      workspaceSlug={workspaceSlug.toString()}
                      projectId={projectId.toString()}
                      epicId={issueId.toString()}
                    />
                  </>
                ) : (
                  <>
                    <IssueDetailRoot
                      workspaceSlug={workspaceSlug.toString()}
                      projectId={projectId.toString()}
                      issueId={issueId.toString()}
                      is_archived={!!issue?.archived_at}
                    />
                  </>
                )}
              </>
            )
          )}
        </ProjectAuthWrapper>
      )}
    </>
  );
});

export default IssueDetailsPage;
