import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { InboxActionsHeader, InboxMainContent, InboxIssuesListSidebar } from "components/inbox";
import { ProjectInboxHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";

const ProjectInboxPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxFilters: inboxFiltersStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && inboxId ? `INBOX_FILTERS_${inboxId.toString()}` : null,
    workspaceSlug && projectId && inboxId
      ? () => inboxFiltersStore.fetchInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString())
      : null
  );

  return (
    <div className="flex flex-col h-full">
      <InboxActionsHeader />
      <div className="grid grid-cols-4 flex-1 divide-x divide-custom-border-200 overflow-hidden">
        <InboxIssuesListSidebar />
        <div className="col-span-3 h-full overflow-auto">
          <InboxMainContent />
        </div>
      </div>
    </div>
  );
};

ProjectInboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectInboxHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectInboxPage;
