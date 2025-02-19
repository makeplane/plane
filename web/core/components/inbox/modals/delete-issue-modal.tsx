import React, { useState } from "react";
import { observer } from "mobx-react";
// types
import { PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// ui
import { AlertModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// constants
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
  const { t } = useTranslation();
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
          title: `${t("success")!}`,
          message: `${t("inbox_issue.modals.delete.success")!}`,
        });
      })
      .catch((errors) => {
        const isPermissionError = errors?.error === "Only admin or creator can delete the work item";
        const currentError = isPermissionError
          ? PROJECT_ERROR_MESSAGES.permissionError
          : PROJECT_ERROR_MESSAGES.issueDeleteError;
        setToast({
          title: t(currentError.i18n_title),
          type: TOAST_TYPE.ERROR,
          message: currentError.i18n_message && t(currentError.i18n_message),
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
      title={t("inbox_issue.modals.delete.title")}
      // TODO: Need to translate the confirmation message
      content={
        <>
          Are you sure you want to delete work item{" "}
          <span className="break-words font-medium text-custom-text-100">
            {projectDetails?.identifier}-{data?.sequence_id}
          </span>
          {""}? The work item will only be deleted from the intake and this action cannot be undone.
        </>
      }
    />
  );
});
