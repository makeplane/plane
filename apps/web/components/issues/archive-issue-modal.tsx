/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import type { TDeDupeIssue, TIssue } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  data?: TIssue | TDeDupeIssue;
  dataId?: string | null | undefined;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export function ArchiveIssueModal(props: Props) {
  const { dataId, data, isOpen, handleClose, onSubmit } = props;
  const { t } = useTranslation();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  const { issueMap } = useIssues();

  if (!dataId && !data) return null;

  const issue = data ? data : issueMap[dataId!];
  const projectDetails = getProjectById(issue.project_id);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveIssue = async () => {
    if (!onSubmit) return;

    setIsArchiving(true);
    try {
      await onSubmit();
      setToast({
        type: "success",
        title: t("issue.archive.success.label"),
        message: t("issue.archive.success.message"),
      });
      onClose();
    } catch {
      setToast({
        type: "error",
        title: t("common.error.label"),
        message: t("issue.archive.failed.message"),
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleArchiveIssue}
      isSubmitting={isArchiving}
      variant="primary"
      title={`${t("issue.archive.label")} ${projectDetails?.identifier ?? ""} ${issue.sequence_id}`}
      content={t("issue.archive.confirm_message")}
      primaryButtonText={{ loading: t("common.archiving"), default: t("common.archive") }}
      secondaryButtonText={t("common.cancel")}
    />
  );
}
