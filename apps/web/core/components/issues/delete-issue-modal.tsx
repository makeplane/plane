import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { PROJECT_ERROR_MESSAGES, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TDeDupeIssue, TIssue } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// constants
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane-web

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  dataId?: string | null | undefined;
  data?: TIssue | TDeDupeIssue;
  isSubIssue?: boolean;
  onSubmit?: () => Promise<void>;
  isEpic?: boolean;
};

export const DeleteIssueModal = observer(function DeleteIssueModal(props: Props) {
  const { dataId, data, isOpen, handleClose, isSubIssue = false, onSubmit, isEpic = false } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { workspaceSlug } = useParams();
  const { issueMap } = useIssues();
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  const { data: currentUser } = useUser();

  useEffect(() => {
    setIsDeleting(false);
  }, [isOpen]);

  if (!dataId && !data) return null;

  // derived values
  const issue = data ? data : issueMap[dataId!];
  const projectDetails = getProjectById(issue?.project_id);
  const isIssueCreator = issue?.created_by === currentUser?.id;

  const canPerformProjectAdminActions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectDetails?.id
  );

  const authorized = isIssueCreator || canPerformProjectAdminActions;

  const onClose = () => {
    setIsDeleting(false);
    handleClose();
  };

  const handleIssueDelete = async () => {
    setIsDeleting(true);

    if (!authorized) {
      setToast({
        title: t(PROJECT_ERROR_MESSAGES.permissionError.i18n_title),
        type: TOAST_TYPE.ERROR,
        message:
          PROJECT_ERROR_MESSAGES.permissionError.i18n_message && t(PROJECT_ERROR_MESSAGES.permissionError.i18n_message),
      });
      onClose();
      return;
    }
    if (onSubmit)
      await onSubmit()
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("common.success"),
            message: t("entity.delete.success", {
              entity: isSubIssue ? t("common.sub_work_item") : isEpic ? t("common.epic") : t("common.work_item"),
            }),
          });
          onClose();
        })
        .catch((errors) => {
          const isPermissionError =
            errors?.error ===
            `Only admin or creator can delete the ${isSubIssue ? "sub-work item" : isEpic ? "epic" : "work item"}`;
          const currentError = isPermissionError
            ? PROJECT_ERROR_MESSAGES.permissionError
            : PROJECT_ERROR_MESSAGES.issueDeleteError;
          setToast({
            title: t(currentError.i18n_title),
            type: TOAST_TYPE.ERROR,
            message: currentError.i18n_message && t(currentError.i18n_message),
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
      title={t("entity.delete.label", { entity: isEpic ? t("common.epic") : t("common.work_item") })}
      content={
        <>
          {/* TODO: Translate here */}
          {`Are you sure you want to delete ${isEpic ? "epic" : "work item"} `}
          <span className="break-words font-medium text-primary">
            {projectDetails?.identifier}-{issue?.sequence_id}
          </span>
          {` ? All of the data related to the ${isEpic ? "epic" : "work item"} will be permanently removed. This action cannot be undone.`}
        </>
      }
    />
  );
});
