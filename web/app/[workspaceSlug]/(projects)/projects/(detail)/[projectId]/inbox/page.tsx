"use client";
import { observer } from "mobx-react";
// components
import { useParams, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { InboxIssueRoot } from "@/components/inbox";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { EInboxIssueCurrentTab } from "@/helpers/inbox.helper";
// hooks
import { useProject } from "@/hooks/store";

const ProjectInboxPage = observer(() => {
  /// router
  const { workspaceSlug, projectId } = useParams();

  const searchParams = useSearchParams();

  const navigationTab = searchParams.get("currentTab");
  const inboxIssueId = searchParams.get("inboxIssueId");

  // hooks
  const { currentProjectDetails } = useProject();

  // No access to inbox
  if (currentProjectDetails?.inbox_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          type={EmptyStateType.DISABLED_PROJECT_INBOX}
          primaryButtonLink={`/${workspaceSlug}/projects/${projectId}/settings/features`}
        />
      </div>
    );

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Intake` : "Plane - Intake";

  const currentNavigationTab = navigationTab
    ? navigationTab === "open"
      ? EInboxIssueCurrentTab.OPEN
      : EInboxIssueCurrentTab.CLOSED
    : undefined;

  if (!workspaceSlug || !projectId) return <></>;

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="w-full h-full overflow-hidden">
        <InboxIssueRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssueId={inboxIssueId?.toString() || undefined}
          inboxAccessible={currentProjectDetails?.inbox_view || false}
          navigationTab={currentNavigationTab}
        />
      </div>
    </div>
  );
});

export default ProjectInboxPage;
