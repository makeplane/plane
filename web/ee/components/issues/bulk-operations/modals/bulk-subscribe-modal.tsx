import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { TOAST_TYPE, setToast, AlertModalCore, EModalPosition, EModalWidth } from "@plane/ui";
// constants
import { EErrorCodes, ERROR_DETAILS } from "@/constants/errors";
import { EIssuesStoreType } from "@/constants/issue";
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
  // store hooks
  const {
    issues: { subscribeBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);

  const issueVariant = issueIds.length > 1 ? "issues" : "issue";

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
        const errorInfo = ERROR_DETAILS[error?.error_code as EErrorCodes] ?? undefined;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: errorInfo?.title ?? "Error!",
          message: errorInfo?.message ?? "Something went wrong. Please try again.",
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
