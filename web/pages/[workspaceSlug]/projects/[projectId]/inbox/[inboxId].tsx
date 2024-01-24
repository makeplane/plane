import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react";
// hooks
import { useProject, useInboxIssues } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectInboxHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { currentProjectDetails } = useProject();
  const {
    filters: { fetchInboxFilters },
    issues: { fetchInboxIssues },
  } = useInboxIssues();

  useSWR(
    workspaceSlug && projectId && currentProjectDetails && currentProjectDetails?.inbox_view
      ? `INBOX_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId && inboxId && currentProjectDetails && currentProjectDetails?.inbox_view) {
        await fetchInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString());
        await fetchInboxIssues(workspaceSlug.toString(), projectId.toString(), inboxId.toString());
      }
    }
  );

  return <div className="flex h-full flex-col">inbox issues component</div>;
});

ProjectInboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectInboxHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectInboxPage;
