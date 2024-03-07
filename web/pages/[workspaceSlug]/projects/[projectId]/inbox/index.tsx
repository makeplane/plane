import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { ProjectInboxHeader } from "components/headers";
import { InboxLayoutLoader } from "components/ui";
import { useInbox, useProject, useProjectInbox } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// ui
// components
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // return null when workspaceSlug or projectId is not available
  if (!workspaceSlug || !projectId) return null;
  // store
  const { fetchInboxIssues, projectInboxIssues } = useProjectInbox();
  // fetching inbox issues
  const { isLoading } = useSWR(`PROJECT_INBOX_ISSUES_${projectId}`, () => {
    fetchInboxIssues(workspaceSlug.toString(), projectId.toString());
  });
  // derived values
  // const inboxIssues = projectInboxIssues;

  if (!projectInboxIssues) {
    <div className="flex h-full flex-col">
      <InboxLayoutLoader />
    </div>;
  }

  return <div className="flex h-full flex-col">Inbox Issues Page</div>;
});

ProjectInboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectInboxHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectInboxPage;
