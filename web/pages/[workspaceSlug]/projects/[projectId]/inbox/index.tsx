import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// icons
import { Inbox } from "lucide-react";
// components
import { PageHead } from "components/core";
import { ProjectInboxHeader } from "components/headers";
import { InboxIssueList, InboxIssueFilterSelection } from "components/inbox";
import { InboxLayoutLoader } from "components/ui";
// hooks
import { useProject, useProjectInbox } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;
  // return null when workspaceSlug or projectId is not available
  if (!workspaceSlug || !projectId) return null;
  // store
  const { fetchInboxIssues, projectInboxIssues } = useProjectInbox();
  const { currentProjectDetails } = useProject();
  // fetching inbox issues
  useSWR(`PROJECT_INBOX_ISSUES_${projectId}`, () => {
    fetchInboxIssues(workspaceSlug.toString(), projectId.toString());
  });
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Inbox` : undefined;
  // const inboxIssues = projectInboxIssues;

  if (!projectInboxIssues || !currentProjectDetails) {
    return (
      <div className="flex h-full flex-col">
        <InboxLayoutLoader />
      </div>
    );
  }

  if (!inboxIssueId) {
    router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${projectInboxIssues?.[0]?.issue.id}`);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="relative flex h-full overflow-hidden">
        <div className="flex-shrink-0 w-[340px] h-full border-r border-custom-border-300">
          <div className="relative flex flex-col w-full h-full">
            <div className="flex-shrink-0 w-full h-[50px] relative flex justify-between items-center gap-2 p-2 px-3 border-b border-custom-border-300">
              <div className="relative flex items-center gap-1">
                <div className="relative w-6 h-6 flex justify-center items-center rounded bg-custom-background-80">
                  <Inbox className="w-4 h-4" />
                </div>
              </div>
              <div className="z-20">
                <InboxIssueFilterSelection workspaceSlug={workspaceSlug} projectId={projectId} />
              </div>
            </div>
            <div className="w-full h-auto">
              {/* <InboxIssueAppliedFilter workspaceSlug={workspaceSlug} projectId={projectId} /> */}
            </div>
            <div className="w-full h-full overflow-hidden">
              <InboxIssueList
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                projectIdentifier={currentProjectDetails?.identifier}
                inboxIssues={projectInboxIssues}
              />
            </div>
          </div>
        </div>
        <div className="w-full">
          {/* <InboxContentRoot
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            inboxIssueId={inboxIssueId?.toString() || undefined}
          /> */}
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
