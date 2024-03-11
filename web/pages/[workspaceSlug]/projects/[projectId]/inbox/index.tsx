import { ReactElement, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// icons
import { Inbox } from "lucide-react";
// ui
import { Loader } from "@plane/ui";
// components
import { PageHead } from "components/core";
import { ProjectInboxHeader } from "components/headers";
import { InboxIssueList, InboxIssueFilterSelection, InboxIssueAppliedFilter, InboxContentRoot } from "components/inbox";
import { InboxLayoutLoader } from "components/ui";
// hooks
import { useProject, useProjectInbox } from "hooks/store";
import { useIntersectionObserver } from "hooks/use-intersection-observer";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  /// router
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;
  // store
  const {
    inboxIssues,
    inboxIssuesArray,
    inboxIssuePaginationInfo: paginationInfo,
    fetchInboxIssues,
    fetchInboxIssuesNextPage,
  } = useProjectInbox();
  const { currentProjectDetails } = useProject();

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    console.log("loading more");
    fetchInboxIssuesNextPage(workspaceSlug.toString(), projectId.toString());
  }, [fetchInboxIssuesNextPage, projectId, workspaceSlug]);
  // page observer
  useIntersectionObserver({
    containerRef,
    elementRef,
    callback: fetchNextPages,
    rootMargin: "20%",
  });
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

  // if (!inboxIssueId) {
  //   router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${inboxIssues?.[0]?.issue.id}`);
  // }

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
                <InboxIssueFilterSelection workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
              </div>
            </div>
            <div className="w-full h-auto">
              <InboxIssueAppliedFilter workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="overflow-y-auto w-full h-full vertical-scrollbar scrollbar-md" ref={containerRef}>
                <InboxIssueList
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  projectIdentifier={currentProjectDetails?.identifier}
                  inboxIssues={inboxIssuesArray}
                />
                <div className="mt-4" ref={elementRef}>
                  {paginationInfo?.next_page_results && (
                    <Loader className="mx-auto w-full space-y-4 pb-4">
                      <Loader.Item height="64px" width="w-100" />
                      <Loader.Item height="64px" width="w-100" />
                    </Loader>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          {inboxIssueId ? (
            <InboxContentRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              inboxIssueId={inboxIssueId?.toString() || undefined}
            />
          ) : (
            <div className="grid h-full place-items-center p-4 text-custom-text-200">
              <div className="grid h-full place-items-center">
                <div className="my-5 flex flex-col items-center gap-4">
                  <Inbox size={60} strokeWidth={1.5} />
                  {inboxIssuesArray && inboxIssuesArray.length > 0 ? (
                    <span className="text-custom-text-200">
                      {inboxIssuesArray?.length} issues found. Select an issue from the sidebar to view its details.
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
