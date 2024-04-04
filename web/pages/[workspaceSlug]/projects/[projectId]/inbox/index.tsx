import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { ProjectInboxHeader } from "@/components/headers";
import { InboxSidebar, InboxIssueRoot } from "@/components/inbox";
import { InboxLayoutLoader } from "@/components/ui";
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  /// router
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;
  // hooks
  const { currentProjectDetails } = useProject();
  const { inboxIssues, inboxIssuesArray, fetchInboxIssues } = useProjectInbox();

  // return null when workspaceSlug or projectId is not available
  if (!workspaceSlug || !projectId) return <></>;

  // fetching inbox issues
  useSWR(
    workspaceSlug && projectId ? `PROJECT_INBOX_ISSUES_${workspaceSlug}_${projectId}` : null,
    () => {
      workspaceSlug && projectId && fetchInboxIssues(workspaceSlug.toString(), projectId.toString());
    },
    { revalidateOnFocus: false }
  );

  if (!inboxIssues || !currentProjectDetails) {
    return (
      <div className="flex h-full flex-col">
        <InboxLayoutLoader />
      </div>
    );
  }

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Inbox` : "Plane - Inbox";

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="relative flex h-full overflow-hidden">
        <InboxSidebar workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        <InboxIssueRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssueId={inboxIssueId?.toString()}
          inboxIssuesArrayLength={(inboxIssuesArray || []).length}
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
