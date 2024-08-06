import React, { useState } from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// ui
import { AlertModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// constants
import { PROJECT_ERROR_MESSAGES } from "@/constants/project";
// hooks
import { useProject } from "@/hooks/store";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export const DeleteInboxIssueModal: React.FC<Props> = observer(({ isOpen, onClose, onSubmit, data }) => {
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onSubmit()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Issue deleted successfully`,
        });
      })
      .catch((errors) => {
        const isPermissionError = errors?.error === "Only admin or creator can delete the issue";
        const currentError = isPermissionError
          ? PROJECT_ERROR_MESSAGES.permissionError
          : PROJECT_ERROR_MESSAGES.issueDeleteError;
        setToast({
          title: currentError.title,
          type: TOAST_TYPE.ERROR,
          message: currentError.message,
        });
      })
      .finally(() => handleClose());
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Delete issue"
      content={
        <>
          Are you sure you want to delete issue{" "}
          <span className="break-words font-medium text-custom-text-100">
            {projectDetails?.identifier}-{data?.sequence_id}
          </span>
          {""}? The issue will only be deleted from the intake and this action cannot be undone.
        </>
      }
    />
  );
});
