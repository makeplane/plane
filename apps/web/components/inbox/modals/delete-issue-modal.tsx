/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
// types
import { PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import type { TIssue } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// constants
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export const DeleteInboxIssueModal = observer(function DeleteInboxIssueModal({
  isOpen,
  onClose,
  onSubmit,
  data,
}: Props) {
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
          type: "success",
          title: `${t("success")}`,
          message: `${t("inbox_issue.modals.delete.success")}`,
        });

        return undefined;
      })
      .catch((errors) => {
        const isPermissionError = errors?.error === "Only admin or creator can delete the work item";
        const currentError = isPermissionError
          ? PROJECT_ERROR_MESSAGES.permissionError
          : PROJECT_ERROR_MESSAGES.issueDeleteError;
        setToast({
          title: t(currentError.i18n_title),
          type: "error",
          message: currentError.i18n_message && t(currentError.i18n_message),
        });
      })
      .finally(() => handleClose());
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("inbox_issue.modals.delete.title")}
      // TODO: Need to translate the confirmation message
      content={
        <>
          {t("web_ui.are_you_sure_you_want_to_delete_work_item")}{" "}
          <span className="font-medium break-words text-primary">
            {projectDetails?.identifier}-{data?.sequence_id}
          </span>
          {""}
          {t("web_ui.the_work_item_will_only_be_deleted_from_the_intake_and_this_action_cannot_be_undone")}{" "}
        </>
      }
    />
  );
});
