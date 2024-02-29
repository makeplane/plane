import React, { ReactElement, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PageHead } from "components/core";
import { ProjectIssueDetailsHeader } from "components/headers";
import { IssueDetailRoot } from "components/issues";
// ui
import { Loader } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";
// store hooks
import { useApplication, useIssueDetail, useProject } from "hooks/store";

const IssueDetailsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
  // hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { theme: themeStore } = useApplication();
  // fetching issue details
  const { isLoading } = useSWR(
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
        themeStore.toggleIssueDetailSidebar(true);
      }
      if (window && themeStore.issueDetailSidebarCollapsed && window.innerWidth >= 768) {
        themeStore.toggleIssueDetailSidebar(false);
      }
    };

    window.addEventListener("resize", handleToggleIssueDetailSidebar);
    handleToggleIssueDetailSidebar();
    return () => window.removeEventListener("resize", handleToggleIssueDetailSidebar);
  }, [themeStore]);

  return (
    <>
      <PageHead title={pageTitle} />
      {issueLoader ? (
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
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            issueId={issueId.toString()}
          />
        )
      )}
    </>
  );
});

IssueDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectIssueDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default IssueDetailsPage;
