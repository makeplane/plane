import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// components
import { BulkDeleteIssuesModal } from "@/components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// constants
// hooks
import { useCommandPalette, useIssueDetail, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

export const IssueLevelModals = observer(() => {
  // router
  const pathname = usePathname();
  const { workspaceSlug, projectId: paramsProjectId, workItem, cycleId, moduleId } = useParams();
  const router = useAppRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issues: { removeIssue },
  } = useIssuesStore();
  const { fetchIssueWithIdentifier } = useIssueDetail();
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

  const projectIdentifier = workItem?.toString().split("-")[0];
  const sequence_id = workItem?.toString().split("-")[1];

  const { data: issueDetails } = useSWR(
    workspaceSlug && workItem ? `ISSUE_DETAIL_${workspaceSlug}_${projectIdentifier}_${sequence_id}` : null,
    workspaceSlug && workItem
      ? () => fetchIssueWithIdentifier(workspaceSlug.toString(), projectIdentifier, sequence_id)
      : null
  );

  const issueId = issueDetails?.id;
  const projectId = paramsProjectId ?? issueDetails?.project_id;

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
