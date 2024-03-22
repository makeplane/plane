import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { PageHead } from "components/core";
import { ProjectInboxHeader } from "components/headers";
import { InboxSidebar, InboxIssueRoot } from "components/inbox";
import { InboxLayoutLoader } from "components/ui";
// hooks
import { useProject, useProjectInbox } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  /// router
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;
  // store
  const { inboxIssues, fetchInboxIssues, inboxIssuesArray } = useProjectInbox();
  const { currentProjectDetails } = useProject();

  // return null when workspaceSlug or projectId is not available
  if (!workspaceSlug || !projectId) return null;

  // fetching inbox issues
  useSWR(`PROJECT_INBOX_ISSUES_${projectId}`, () => fetchInboxIssues(workspaceSlug.toString(), projectId.toString()), {
    revalidateOnFocus: false,
  });

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Inbox` : undefined;

  if (!inboxIssues || !currentProjectDetails) {
    return (
      <div className="flex h-full flex-col">
        <InboxLayoutLoader />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="relative flex h-full overflow-hidden">
        <InboxSidebar workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        <InboxIssueRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssuesArray={inboxIssuesArray}
          inboxIssueId={inboxIssueId?.toString()}
        />
      </div>
    </div>
  );
});

ProjectInboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectInboxHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectInboxPage;
