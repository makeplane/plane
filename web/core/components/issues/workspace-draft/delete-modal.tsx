"use client";

import { useEffect, useState } from "react";
// types
import { TWorkspaceDraftIssue } from "@plane/types";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { PROJECT_ERROR_MESSAGES } from "@/constants/project";
// hooks
import { useIssues, useUser, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
type Props = {
  isOpen: boolean;
  handleClose: () => void;
  dataId?: string | null | undefined;
  data?: TWorkspaceDraftIssue;
  onSubmit?: () => Promise<void>;
};

export const WorkspaceDraftIssueDeleteIssueModal: React.FC<Props> = (props) => {
  const { dataId, data, isOpen, handleClose, onSubmit } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { issueMap } = useIssues();
  const { allowPermissions } = useUserPermissions();

  const { data: currentUser } = useUser();

  // derived values
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  useEffect(() => {
    setIsDeleting(false);
  }, [isOpen]);

  if (!dataId && !data) return null;

  // derived values
  const issue = data ? data : issueMap[dataId!];
  const isIssueCreator = issue?.created_by === currentUser?.id;
  const authorized = isIssueCreator || canPerformProjectAdminActions;

  const onClose = () => {
    setIsDeleting(false);
    handleClose();
  };

  const handleIssueDelete = async () => {
    setIsDeleting(true);

    if (!authorized) {
      setToast({
        title: PROJECT_ERROR_MESSAGES.permissionError.title,
        type: TOAST_TYPE.ERROR,
        message: PROJECT_ERROR_MESSAGES.permissionError.message,
      });
      onClose();
      return;
    }
    if (onSubmit)
      await onSubmit()
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `draft deleted.`,
          });
          onClose();
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
        .finally(() => onClose());
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleIssueDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Delete draft"
      content={<>Are you sure you want to delete this draft? This can&apos;t be undone.</>}
    />
  );
};
