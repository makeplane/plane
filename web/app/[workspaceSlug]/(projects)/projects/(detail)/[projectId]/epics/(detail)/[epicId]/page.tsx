"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { EIssueServiceType } from "@plane/constants";
// ui
import { Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
// hooks
import { useAppTheme, useIssueDetail, useProject } from "@/hooks/store";
// assets
import { useAppRouter } from "@/hooks/use-app-router";
import { EpicDetailRoot } from "@/plane-web/components/epics";
import { useIssueTypes } from "@/plane-web/hooks/store";
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";

const EpicDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, epicId } = useParams();
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getProjectById } = useProject();
  const { toggleIssueDetailSidebar, issueDetailSidebarCollapsed } = useAppTheme();
  // fetching issue details
  const { isLoading, error } = useSWR(
    workspaceSlug && projectId && epicId ? `ISSUE_DETAIL_${workspaceSlug}_${projectId}_${epicId}` : null,
    workspaceSlug && projectId && epicId
      ? () => fetchIssue(workspaceSlug.toString(), projectId.toString(), epicId.toString())
      : null
  );
  // fetching metric details
  // derived values
  const issue = getIssueById(epicId?.toString() || "") || undefined;
  const project = (issue?.project_id && getProjectById(issue?.project_id)) || undefined;
  const issueLoader = !issue || isLoading;
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
          title="Epic does not exist"
          description="The epic you are looking for does not exist, has been archived, or has been deleted."
          primaryButton={{
            text: "View other epics",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/epics`),
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
        epicId && (
          <EpicDetailRoot
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            epicId={epicId.toString()}
          />
        )
      )}
    </>
  );
});

export default EpicDetailsPage;
