import { useRouter } from "next/router";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { InboxActionHeader, InboxMainContent, InboxIssuesListSidebar } from "components/inbox";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";

const ProjectInbox: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxIssues: inboxIssuesStore, inboxFilters: inboxFiltersStore } = useMobxStore();

  const { projectDetails } = useProjectDetails();

  useSWR(
    workspaceSlug && projectId && inboxId ? `REVALIDATE_INBOX_${inboxId.toString()}` : null,
    workspaceSlug && projectId && inboxId
      ? async () => {
          await inboxFiltersStore.fetchInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString());
          await inboxIssuesStore.fetchInboxIssues(workspaceSlug.toString(), projectId.toString(), inboxId.toString());
        }
      : null
  );

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Inbox`} />
        </Breadcrumbs>
      }
      right={<></>}
    >
      <div className="flex flex-col h-full">
        <InboxActionHeader />
        <div className="grid grid-cols-4 flex-1 divide-x divide-custom-border-200 overflow-hidden">
          <InboxIssuesListSidebar />
          <div className="col-span-3 h-full overflow-auto">
            <InboxMainContent />
          </div>
        </div>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectInbox;
