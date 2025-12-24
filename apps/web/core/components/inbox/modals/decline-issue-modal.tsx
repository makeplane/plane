import React, { useState } from "react";
// types
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function DeclineIssueModal(props: Props) {
  const { isOpen, onClose, data, onSubmit } = props;
  // states
  const [isDeclining, setIsDeclining] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;

  const handleClose = () => {
    setIsDeclining(false);
    onClose();
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    await onSubmit().finally(() => setIsDeclining(false));
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDecline}
      isSubmitting={isDeclining}
      isOpen={isOpen}
      title={t("inbox_issue.modals.decline.title")}
      // TODO: Need to translate the confirmation message
      content={
        <>
          Are you sure you want to decline work item{" "}
          <span className="break-words font-medium text-primary">
            {projectDetails?.identifier}-{data?.sequence_id}
          </span>
          {""}? This action cannot be undone.
        </>
      }
      primaryButtonText={{
        loading: t("declining"),
        default: t("decline"),
      }}
    />
  );
}
