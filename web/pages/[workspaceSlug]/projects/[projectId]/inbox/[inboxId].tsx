import { ReactElement, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react";
// hooks
import { useProject, useInboxIssues } from "hooks/store";
import useSize from "hooks/use-window-size";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectInboxHeader } from "components/headers";
import { InboxSidebarRoot, InboxContentRoot, MobileInboxIssuesActionHeader } from "components/inbox";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;
  // states
  const [isInboxSidebarOpen, setIsInboxSidebarOpen] = useState(false);
  const [isIssueDetailSidebarOpen, setIsIssueDetailSidebarOpen] = useState(false);
  // store hooks
  const { currentProjectDetails } = useProject();
  const {
    filters: { fetchInboxFilters },
    issues: { fetchInboxIssues },
  } = useInboxIssues();

  const {windowWidth} = useSize();

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

  if (!workspaceSlug || !projectId || !inboxId || !currentProjectDetails?.inbox_view) return <></>;
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="md:hidden h-[50px] flex-shrink-0 w-full border-b border-custom-border-200">
        <MobileInboxIssuesActionHeader
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxId={inboxId.toString()}
          inboxIssueId={inboxIssueId?.toString() || undefined}
          isInboxSidebarOpen={isInboxSidebarOpen}
          setIsInboxSidebarOpen={setIsInboxSidebarOpen}
          isIssueDetailSidebarOpen={isIssueDetailSidebarOpen}
          setIsIssueDetailSidebarOpen={setIsIssueDetailSidebarOpen}
        />
      </div>
      <div className="relative flex overflow-hidden h-full">
        {(windowWidth >= 768 || (windowWidth < 768 && isInboxSidebarOpen)) && (
          <div className="absolute md:relative z-10 flex-shrink-0 md:w-[340px] w-full h-full border-r border-custom-border-300">
            <InboxSidebarRoot
              setIsInboxSidebarOpen={setIsInboxSidebarOpen}
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              inboxId={inboxId.toString()}
            />
          </div>
        )}
        <div className="w-full overflow-auto">
          <InboxContentRoot
            isIssueDetailSidebarOpen={isIssueDetailSidebarOpen}
            setIsIssueDetailSidebarOpen={setIsIssueDetailSidebarOpen}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            inboxId={inboxId.toString()}
            inboxIssueId={inboxIssueId?.toString() || undefined}
          />
        </div>
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
