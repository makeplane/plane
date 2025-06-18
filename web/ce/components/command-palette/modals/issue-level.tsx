import { FC } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EIssueServiceType, EIssuesStoreType, TIssue } from "@plane/types";
// components
import { BulkDeleteIssuesModal } from "@/components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// hooks
import { useCommandPalette, useIssueDetail, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";

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

  const { removeIssue: removeEpic } = useIssuesActions(EIssuesStoreType.EPIC);
  const { removeIssue: removeWorkItem } = useIssuesActions(EIssuesStoreType.PROJECT);

  const {
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isDeleteIssueModalOpen,
    toggleDeleteIssueModal,
    isBulkDeleteIssueModalOpen,
    toggleBulkDeleteIssueModal,
    createWorkItemAllowedProjectIds,
  } = useCommandPalette();
  // derived values
  const issueDetails = issueId ? getIssueById(issueId) : undefined;
  const isDraftIssue = pathname?.includes("draft-issues") || false;
  const { fetchSubIssues: fetchSubWorkItems } = useIssueDetail();
  const { fetchSubIssues: fetchEpicSubWorkItems } = useIssueDetail(EIssueServiceType.EPICS);

  const handleDeleteIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const isEpic = issueDetails?.is_epic;
      const deleteAction = isEpic ? removeEpic : removeWorkItem;
      const redirectPath = `/${workspaceSlug}/projects/${projectId}/${isEpic ? "epics" : "issues"}`;

      await deleteAction(projectId, issueId);
      router.push(redirectPath);
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  };

  const handleCreateIssueSubmit = async (newIssue: TIssue) => {
    if (!workspaceSlug || !newIssue.project_id || !newIssue.id || newIssue.parent_id !== issueDetails?.id) return;

    const fetchAction = issueDetails?.is_epic ? fetchEpicSubWorkItems : fetchSubWorkItems;
    await fetchAction(workspaceSlug?.toString(), newIssue.project_id, issueDetails.id);
  };

  const getCreateIssueModalData = () => {
    if (cycleId) return { cycle_id: cycleId.toString() };
    if (moduleId) return { module_ids: [moduleId.toString()] };
    return undefined;
  };

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => toggleCreateIssueModal(false)}
        data={getCreateIssueModalData()}
        isDraft={isDraftIssue}
        onSubmit={handleCreateIssueSubmit}
        allowedProjectIds={createWorkItemAllowedProjectIds}
      />
      {workspaceSlug && projectId && issueId && issueDetails && (
        <DeleteIssueModal
          handleClose={() => toggleDeleteIssueModal(false)}
          isOpen={isDeleteIssueModalOpen}
          data={issueDetails}
          onSubmit={() => handleDeleteIssue(workspaceSlug.toString(), projectId?.toString(), issueId?.toString())}
          isEpic={issueDetails?.is_epic}
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
