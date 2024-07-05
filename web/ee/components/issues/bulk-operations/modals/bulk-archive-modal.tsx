import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { TOAST_TYPE, setToast, AlertModalCore, EModalPosition, EModalWidth } from "@plane/ui";
// constants
import { EErrorCodes, ERROR_DETAILS } from "@/constants/errors";
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
  // store hooks
  const {
    issues: { archiveBulkIssues },
  } = useIssuesStore();

  const handleSubmit = async () => {
    setIsDeleting(true);

    archiveBulkIssues &&
      (await archiveBulkIssues(workspaceSlug, projectId, issueIds)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "",
            message: `${issueIds.length} ${issueIds.length > 1 ? "issues have" : "issue has"} been archived successfully.`,
          });
          onSubmit?.();
          handleClose();
        })
        .catch((error: { error_code: EErrorCodes }) => {
          const errorInfo = ERROR_DETAILS[error?.error_code] ?? undefined;
          setToast({
            type: TOAST_TYPE.ERROR,
            title: errorInfo?.title ?? "Error!",
            message: errorInfo?.message ?? "Something went wrong. Please try again.",
          });
        })
        .finally(() => setIsDeleting(false)));
  };

  const issueVariant = issueIds.length > 1 ? "issues" : "issue";

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
