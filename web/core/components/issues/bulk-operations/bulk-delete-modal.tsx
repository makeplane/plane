import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore, EModalPosition, EModalWidth } from "@/components/core";
// constants
// hooks
import { useIssues } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";

type Props = {
  handleClose: () => void;
  isOpen: boolean;
  issueIds: string[];
  onSubmit?: () => void;
  projectId: string;
  workspaceSlug: string;
};

export const BulkDeleteConfirmationModal: React.FC<Props> = observer((props) => {
  const { handleClose, isOpen, issueIds, onSubmit, projectId, workspaceSlug } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const storeType = useIssueStoreType();
  const {
    issues: { removeBulkIssues },
  } = useIssues(storeType);

  const handleSubmit = async () => {
    setIsDeleting(true);

    await removeBulkIssues(workspaceSlug, projectId, issueIds)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issues deleted successfully.",
        });
        onSubmit?.();
        handleClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsDeleting(false));
  };

  const issueVariant = issueIds.length > 1 ? "issues" : "issue";

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      variant="danger"
      position={EModalPosition.CENTER}
      width={EModalWidth.XL}
      title={`Delete ${issueVariant}`}
      content={
        <>
          Are you sure you want to delete {issueIds.length} {issueVariant}? Sub issues of selected {issueVariant} will
          also be deleted. All of the data related to the {issueVariant} will be permanently removed. This action cannot
          be undone.
        </>
      }
      primaryButtonText={{
        loading: "Deleting",
        default: `Delete ${issueVariant}`,
      }}
    />
  );
});
