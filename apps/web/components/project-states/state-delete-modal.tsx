/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import type { IState } from "@plane/types";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type TStateDeleteModal = {
  isOpen: boolean;
  onClose: () => void;
  data: IState | null;
};

export const StateDeleteModal = observer(function StateDeleteModal(props: TStateDeleteModal) {
  const { t } = useTranslation();

  const { isOpen, onClose, data } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  const { deleteState } = useProjectState();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    try {
      await deleteState(workspaceSlug.toString(), data.project_id, data.id);
      handleClose();
    } catch (err) {
      if ((err as { status?: number })?.status === 400)
        setToast({
          type: "error",
          title: t("error"),
          message: t(
            "web_ui.this_state_contains_some_work_items_within_it_please_move_them_to_some_other_state_to_dele"
          ),
        });
      else
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.state_could_not_be_deleted_please_try_again"),
        });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title={t("web_ui.delete_state")}
      content={
        <>
          {t("web_ui.are_you_sure_you_want_to_delete_state")}{" "}
          <span className="font-medium text-primary">{data?.name}</span>
          {t("web_ui.all_of_the_data_related_to_the_state_will_be_permanently_removed_this_action_cannot_be_und")}{" "}
        </>
      }
    />
  );
});
