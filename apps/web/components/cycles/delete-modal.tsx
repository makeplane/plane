/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// types
import { PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import type { ICycle } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useAppRouter } from "@/hooks/use-app-router";

interface ICycleDelete {
  cycle: ICycle;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  projectId: string;
}

export const CycleDeleteModal = observer(function CycleDeleteModal(props: ICycleDelete) {
  const { isOpen, handleClose, cycle, workspaceSlug, projectId } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { deleteCycle } = useCycle();
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  const { cycleId } = useParams();
  const searchParams = useSearchParams();
  const peekCycle = searchParams.get("peekCycle");

  const formSubmit = async () => {
    if (!cycle) return;

    setLoader(true);
    try {
      await deleteCycle(workspaceSlug, projectId, cycle.id)
        .then(() => {
          if (cycleId || peekCycle) router.push(`/${workspaceSlug}/projects/${projectId}/cycles`);
          setToast({
            type: "success",
            title: t("success"),
            message: t("web_ui.cycle_deleted_successfully"),
          });

          return undefined;
        })
        .catch((errors) => {
          const isPermissionError = errors?.error === "You don't have the required permissions.";
          const currentError = isPermissionError
            ? PROJECT_ERROR_MESSAGES.permissionError
            : PROJECT_ERROR_MESSAGES.cycleDeleteError;
          setToast({
            title: t(currentError.i18n_title),
            type: "error",
            message: currentError.i18n_message && t(currentError.i18n_message),
          });
        })
        .finally(() => handleClose());
    } catch {
      setToast({
        type: "error",
        title: t("warning"),
        message: t("web_ui.something_went_wrong_please_try_again_later"),
      });
    }

    setLoader(false);
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("web_ui.delete_cycle")}
      content={
        <>
          {t("web_ui.are_you_sure_you_want_to_delete_cycle")}
          {' "'}
          <span className="font-medium break-words text-primary">{cycle?.name}</span>
          {'"'}
          {t("web_ui.all_of_the_data_related_to_the_cycle_will_be_permanently_removed_this_action_cannot_be_und")}{" "}
        </>
      }
    />
  );
});
