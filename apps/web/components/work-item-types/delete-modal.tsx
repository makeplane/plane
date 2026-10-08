/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useSWRConfig } from "swr";
// plane imports
import { PROJECT_ISSUE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId: string | null;
  isOpen: boolean;
  handleClose: () => void;
};

export const IssueTypeDeleteModal = observer(function IssueTypeDeleteModal(props: Props) {
  const { workspaceSlug, projectId, issueTypeId, isOpen, handleClose } = props;
  // store hooks
  const { deleteIssueType, getIssueTypeById } = useIssueTypes();
  // swr
  const { mutate } = useSWRConfig();
  // translation
  const { t } = useTranslation();
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // derived values
  const issueType = issueTypeId ? getIssueTypeById(issueTypeId) : undefined;

  const handleDelete = async () => {
    if (!issueTypeId) return;
    setIsDeleting(true);
    try {
      await deleteIssueType(workspaceSlug, projectId, issueTypeId);
      setToast({
        type: "success",
        title: t("work_item_types.settings.item_delete_confirmation.toast.success.title"),
        message: t("work_item_types.settings.item_delete_confirmation.toast.success.message"),
      });
      await mutate(PROJECT_ISSUE_TYPES(workspaceSlug, projectId));
      handleClose();
    } catch (error) {
      const errorMessage =
        (error as { error?: string; data?: { error?: string } })?.error ??
        (error as { data?: { error?: string } })?.data?.error;
      setToast({
        type: "error",
        title: t("work_item_types.settings.item_delete_confirmation.toast.error.title"),
        message: errorMessage ?? t("work_item_types.settings.item_delete_confirmation.toast.error.message"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      title={t("work_item_types.settings.item_delete_confirmation.title")}
      content={
        <>
          {t("work_item_types.settings.item_delete_confirmation.description")}
          {issueType ? <span className="font-medium text-primary"> {issueType.name}</span> : null}
        </>
      }
      primaryButtonText={{
        default: t("work_item_types.settings.item_delete_confirmation.primary_button"),
        loading: t("common.deleting"),
      }}
    />
  );
});
