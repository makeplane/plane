import { useState } from "react";
import { observer } from "mobx-react";
// plane constants
import { EIssuesStoreType, E_BULK_OPERATION_ERROR_CODES, BULK_OPERATION_ERROR_DETAILS } from "@plane/constants";
// ui
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast, AlertModalCore, EModalPosition, EModalWidth } from "@plane/ui";
// hooks
import { useIssues } from "@/hooks/store";

type Props = {
  handleClose: () => void;
  isOpen: boolean;
  issueIds: string[];
  onSubmit?: () => void;
  projectId: string;
  workspaceSlug: string;
};

export const BulkSubscribeConfirmationModal: React.FC<Props> = observer((props) => {
  const { handleClose, isOpen, issueIds, onSubmit, projectId, workspaceSlug } = props;
  // states
  const [isArchiving, setIsDeleting] = useState(false);
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const {
    issues: { subscribeBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);

  const issueVariant = issueIds.length > 1 ? "work items" : "work item";

  const handleSubmit = async () => {
    setIsDeleting(true);

    await subscribeBulkIssues(workspaceSlug, projectId, issueIds)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "",
          message: `You have been subscribed to ${issueIds.length} ${issueVariant}.`,
        });
        onSubmit?.();
        handleClose();
      })
      .catch((error) => {
        const errorInfo = BULK_OPERATION_ERROR_DETAILS[error?.error_code as E_BULK_OPERATION_ERROR_CODES] ?? undefined;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t(errorInfo?.i18n_title) ?? "Error!",
          message: t(errorInfo?.i18n_message) ?? "Something went wrong. Please try again.",
        });
      })
      .finally(() => setIsDeleting(false));
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isArchiving}
      isOpen={isOpen}
      variant="primary"
      position={EModalPosition.CENTER}
      width={EModalWidth.XL}
      title={`Subscribe to ${issueVariant}`}
      content={
        <>
          Are you sure you want to subscribe to {issueIds.length} {issueVariant}? Once subscribed you will be notified
          about any updates of the {issueVariant}.
        </>
      }
      primaryButtonText={{
        loading: "Subscribing",
        default: "Subscribe",
      }}
      hideIcon
    />
  );
});
