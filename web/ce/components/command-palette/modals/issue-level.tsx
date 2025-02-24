import { FC } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// components
import { BulkDeleteIssuesModal } from "@/components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// constants
// hooks
import { useCommandPalette, useIssueDetail, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

export type TIssueLevelModalsProps = {
  projectId: string | undefined;
  issueId: string | undefined;
};

export const IssueLevelModals: FC<TIssueLevelModalsProps> = observer((props) => {
  const { projectId, issueId } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug, cycleId, moduleId } = useParams();
  const router = useAppRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
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
  const issueDetails = issueId ? getIssueById(issueId) : undefined;
  const isDraftIssue = pathname?.includes("draft-issues") || false;

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
