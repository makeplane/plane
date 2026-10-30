/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { setToast } from "@plane/blocks/toast";
import type { IIssueLabel } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// hooks
import { useLabel } from "@/hooks/store/use-label";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IIssueLabel | null;
};

export const DeleteLabelModal = observer(function DeleteLabelModal(props: Props) {
  const { t } = useTranslation();

  const { isOpen, onClose, data } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { deleteLabel } = useLabel();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !projectId || !data) return;

    setIsDeleteLoading(true);

    try {
      await deleteLabel(workspaceSlug.toString(), projectId.toString(), data.id);
      handleClose();
    } catch (err) {
      setIsDeleteLoading(false);
      const error =
        err && typeof err === "object" && "error" in err && typeof err.error === "string" && err.error
          ? err.error
          : "Label could not be deleted. Please try again.";
      setToast({
        type: "error",
        title: t("error"),
        message: error,
      });
    }
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title={t("web_ui.delete_label")}
      content={
        <>
          {t("sso.domain_management.verified_domains.delete_domain.description.prefix")}{" "}
          <span className="font-medium text-primary">{data?.name}</span>
          {t("web_ui.this_will_remove_the_label_from_all_the_work_item_and_from_any_views_where_the_label_is_be")}{" "}
        </>
      }
    />
  );
});
