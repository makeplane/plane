import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react";
import { Inbox } from "lucide-react";
// hooks
import { useProject, useInboxIssues } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// ui
import { Spinner } from "@plane/ui";
// components
import { ProjectInboxHeader } from "components/headers";
import { InboxSidebarRoot, InboxIssueActionsHeader } from "components/inbox";
import { InboxIssueDetailRoot } from "components/issues/issue-detail/inbox";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;
  // store hooks
  const {
    issues: { getInboxIssuesByInboxId },
  } = useInboxIssues();
  const { currentProjectDetails } = useProject();
  const {
    filters: { fetchInboxFilters },
    issues: { loader, fetchInboxIssues },
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

  // inbox issues list
  const inboxIssuesList = inboxId ? getInboxIssuesByInboxId(inboxId?.toString()) : undefined;

  if (!workspaceSlug || !projectId || !inboxId) return <></>;
  return (
    <>
      {loader === "fetch" ? (
        <div className="relative flex w-full h-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="relative flex h-full overflow-hidden">
          <div className="flex-shrink-0 w-[340px] h-full border-r border-custom-border-100">
            {workspaceSlug && projectId && inboxId && (
              <InboxSidebarRoot
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                inboxId={inboxId.toString()}
              />
            )}
          </div>
          <div className="w-full">
            {workspaceSlug && projectId && inboxId && inboxIssueId ? (
              <div className="w-full h-full overflow-hidden relative flex flex-col">
                <div className="flex-shrink-0 min-h-[50px] border-b border-custom-border-100">
                  <InboxIssueActionsHeader
                    workspaceSlug={workspaceSlug.toString()}
                    projectId={projectId.toString()}
                    inboxId={inboxId.toString()}
                    inboxIssueId={inboxIssueId?.toString() || undefined}
                  />
                </div>
                <div className="w-full h-full">
                  <InboxIssueDetailRoot
                    workspaceSlug={workspaceSlug.toString()}
                    projectId={projectId.toString()}
                    inboxId={inboxId.toString()}
                    issueId={inboxIssueId.toString()}
                  />
                </div>
              </div>
            ) : (
              <div className="grid h-full place-items-center p-4 text-custom-text-200">
                <div className="grid h-full place-items-center">
                  <div className="my-5 flex flex-col items-center gap-4">
                    <Inbox size={60} strokeWidth={1.5} />
                    {inboxIssuesList && inboxIssuesList.length > 0 ? (
                      <span className="text-custom-text-200">
                        {inboxIssuesList?.length} issues found. Select an issue from the sidebar to view its details.
                      </span>
                    ) : (
                      <span className="text-custom-text-200">No issues found</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
