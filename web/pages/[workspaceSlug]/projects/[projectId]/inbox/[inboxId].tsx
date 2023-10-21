import { useRouter } from "next/router";
import Link from "next/link";

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
import { BreadcrumbItem, Breadcrumbs } from "@plane/ui";

const ProjectInbox: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxFilters: inboxFiltersStore, project: projectStore } = useMobxStore();

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  useSWR(
    workspaceSlug && projectId && inboxId ? `INBOX_FILTERS_${inboxId.toString()}` : null,
    workspaceSlug && projectId && inboxId
      ? () => inboxFiltersStore.fetchInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString())
      : null
  );

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs onBack={() => router.back()}>
          <BreadcrumbItem
            link={
              <Link href={`/${workspaceSlug}/projects`}>
                <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                  <p>Projects</p>
                </a>
              </Link>
            }
          />
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
