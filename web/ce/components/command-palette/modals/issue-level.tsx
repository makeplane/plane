import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// components
import { BulkDeleteIssuesModal } from "@/components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// constants
import { ISSUE_DETAILS } from "@/constants/fetch-keys";
// hooks
import { useCommandPalette, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
// services
import { IssueService } from "@/services/issue";

// services
const issueService = new IssueService();

export const IssueLevelModals = observer(() => {
  // router
  const pathname = usePathname();
  const { workspaceSlug, projectId, issueId, cycleId, moduleId } = useParams();
  const router = useAppRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issues: { removeIssue },
  } = useIssuesStore();
  const {
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isDeleteIssueModalOpen,
    toggleDeleteIssueModal,
    isBulkDeleteIssueModalOpen,
    toggleBulkDeleteIssueModal,
  } = useCommandPalette();
  // derived values
  const isDraftIssue = pathname?.includes("draft-issues") || false;

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => toggleCreateIssueModal(false)}
        data={cycleId ? { cycle_id: cycleId.toString() } : moduleId ? { module_ids: [moduleId.toString()] } : undefined}
        isDraft={isDraftIssue}
      />
      {workspaceSlug && projectId && issueId && issueDetails && (
        <DeleteIssueModal
          handleClose={() => toggleDeleteIssueModal(false)}
          isOpen={isDeleteIssueModalOpen}
          data={issueDetails}
          onSubmit={async () => {
            await removeIssue(workspaceSlug.toString(), projectId.toString(), issueId.toString());
            router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
          }}
        />
      )}
      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssueModalOpen}
        onClose={() => toggleBulkDeleteIssueModal(false)}
        user={currentUser}
      />
    </>
  );
});
