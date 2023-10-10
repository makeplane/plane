import { useRouter } from "next/router";

// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// contexts
import { InboxViewContextProvider } from "contexts/inbox-view-context";
// components
import { InboxActionHeader, InboxMainContent, IssuesListSidebar } from "components/inbox";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { Button } from "@plane/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";

const ProjectInbox: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { projectDetails } = useProjectDetails();

  return (
    <InboxViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Inbox`} />
          </Breadcrumbs>
        }
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              prependIcon={<PlusIcon />}
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "c" });
                document.dispatchEvent(e);
              }}
            >
              Add Issue
            </Button>
          </div>
        }
      >
        <div className="flex flex-col h-full">
          <InboxActionHeader />
          <div className="grid grid-cols-4 flex-1 divide-x divide-custom-border-200 overflow-hidden">
            <IssuesListSidebar />
            <div className="col-span-3 h-full overflow-auto">
              <InboxMainContent />
            </div>
          </div>
        </div>
      </ProjectAuthorizationWrapper>
    </InboxViewContextProvider>
  );
};

export default ProjectInbox;
