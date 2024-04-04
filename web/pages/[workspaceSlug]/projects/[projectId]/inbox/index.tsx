import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Inbox } from "lucide-react";
// components
import { PageHead } from "@/components/core";
import { ProjectInboxHeader } from "@/components/headers";
import { InboxIssueRoot } from "@/components/inbox";
// hooks
import { useProject } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  /// router
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;
  // hooks
  const { currentProjectDetails } = useProject();

  if (!workspaceSlug || !projectId) return <div>PLease check your URL</div>;

  // No access to inbox
  if (currentProjectDetails?.inbox_view === false)
    return (
      <div className="relative w-full h-full flex flex-col gap-3 justify-center items-center">
        <Inbox size={60} strokeWidth={1.5} />
        <div className="text-custom-text-200">No access to the inbox issues. Please contact your manager.</div>
      </div>
    );

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Inbox` : "Plane - Inbox";

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="w-full h-full overflow-hidden">
        <InboxIssueRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssueId={inboxIssueId?.toString() || undefined}
          inboxAccessible={currentProjectDetails?.inbox_view || false}
        />
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
