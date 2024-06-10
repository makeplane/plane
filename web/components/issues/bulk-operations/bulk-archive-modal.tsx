import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore, EModalPosition, EModalWidth } from "@/components/core";
// constants
import { EErrorCodes, ERROR_DETAILS } from "@/constants/errors";
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

export const BulkArchiveConfirmationModal: React.FC<Props> = observer((props) => {
  const { handleClose, isOpen, issueIds, onSubmit, projectId, workspaceSlug } = props;
  // states
  const [isArchiving, setIsDeleting] = useState(false);
  // store hooks
  const storeType = useIssueStoreType();
  const {
    issues: { archiveBulkIssues },
  } = useIssues(storeType);

  const handleSubmit = async () => {
    setIsDeleting(true);

    archiveBulkIssues &&
      (await archiveBulkIssues(workspaceSlug, projectId, issueIds)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Issues archived successfully.",
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
          Are you sure you want to archive {issueIds.length} {issueVariant}? Sub issues of selected {issueVariant} will
          also be archived. Once archived {issueIds.length > 1 ? "they" : "it"} can be restored later via the archives
          section.
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
