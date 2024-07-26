"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
import { IssueDetailRoot } from "@/components/issues";
// hooks
import { useAppTheme, useIssueDetail, useProject } from "@/hooks/store";
// assets
import { useAppRouter } from "@/hooks/use-app-router";
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";

const IssueDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, issueId } = useParams();
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { toggleIssueDetailSidebar, issueDetailSidebarCollapsed } = useAppTheme();
  // fetching issue details
  const {
    isLoading,
    data: swrIssueDetails,
    error,
  } = useSWR(
    workspaceSlug && projectId && issueId ? `ISSUE_DETAIL_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? () => fetchIssue(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );
  // derived values
  const issue = getIssueById(issueId?.toString() || "") || undefined;
  const project = (issue?.project_id && getProjectById(issue?.project_id)) || undefined;
  const issueLoader = !issue || isLoading ? true : false;
  const pageTitle = project && issue ? `${project?.identifier}-${issue?.sequence_id} ${issue?.name}` : undefined;

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

  return (
    <>
      <PageHead title={pageTitle} />
      {error ? (
        <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title="Issue does not exist"
          description="The issue you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other issues",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/issues`),
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
          <IssueDetailRoot
            swrIssueDetails={swrIssueDetails}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            issueId={issueId.toString()}
          />
        )
      )}
    </>
  );
});

export default IssueDetailsPage;
