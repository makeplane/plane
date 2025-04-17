import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { E_BULK_OPERATION_ERROR_CODES, BULK_OPERATION_ERROR_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast, AlertModalCore, EModalPosition, EModalWidth } from "@plane/ui";
// hooks
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

type Props = {
  handleClose: () => void;
  isOpen: boolean;
  issueIds: string[];
  onSubmit?: () => void;
  projectId: string;
  workspaceSlug: string;
};

export const BulkArchiveConfirmationModal: React.FC<Props> = observer((props) => {
  const { handleClose, isOpen, issueIds, onSubmit, projectId, workspaceSlug } = props;
  // states
  const [isArchiving, setIsDeleting] = useState(false);
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const {
    issues: { archiveBulkIssues },
  } = useIssuesStore();

  const handleSubmit = async () => {
    setIsDeleting(true);

    if (archiveBulkIssues) {
      await archiveBulkIssues(workspaceSlug, projectId, issueIds)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "",
            message: `${issueIds.length} ${issueIds.length > 1 ? "work items have" : "work item has"} been archived successfully.`,
          });
          onSubmit?.();
          handleClose();
        })
        .catch((error: { error_code: E_BULK_OPERATION_ERROR_CODES }) => {
          const errorInfo = BULK_OPERATION_ERROR_DETAILS[error?.error_code] ?? undefined;
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t(errorInfo?.i18n_title) ?? "Error!",
            message: t(errorInfo?.i18n_message) ?? "Something went wrong. Please try again.",
          });
        })
        .finally(() => setIsDeleting(false));
    }
  };

  const issueVariant = issueIds.length > 1 ? "work items" : "work item";

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isArchiving}
      isOpen={isOpen}
      variant="primary"
      position={EModalPosition.CENTER}
      width={EModalWidth.XL}
      title={`Archive ${issueVariant}`}
      content={
        <>
          Are you sure you want to archive {issueIds.length} {issueVariant}? Once archived{" "}
          {issueIds.length > 1 ? "they" : "it"} can be restored later via the archives section.
        </>
      }
      primaryButtonText={{
        loading: "Archiving",
        default: `Archive ${issueVariant}`,
      }}
      hideIcon
    />
  );
});
