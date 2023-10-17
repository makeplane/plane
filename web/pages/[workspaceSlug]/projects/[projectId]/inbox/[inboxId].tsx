import { useRouter } from "next/router";
import { NextPage } from "next";
import useSWR from "swr";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { InboxActionsHeader, InboxMainContent, InboxIssuesListSidebar } from "components/inbox";
import { ProjectInboxHeader } from "components/headers";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";

const ProjectInbox: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxIssues: inboxIssuesStore, inboxFilters: inboxFiltersStore, project: projectStore } = useMobxStore();

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

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
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "", 32)} Inbox`} />
        </Breadcrumbs>
      }
      right={<ProjectInboxHeader />}
    >
      <div className="flex flex-col h-full">
        <InboxActionsHeader />
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
