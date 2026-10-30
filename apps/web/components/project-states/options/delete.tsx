/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { CloseOutline, LoadingOutline } from "@makeplane/propel/icons";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TStateDelete = {
  totalStates: number;
  state: IState;
  deleteStateCallback: TStateOperationsCallbacks["deleteState"];
};

export const StateDelete = observer(function StateDelete(props: TStateDelete) {
  const { totalStates, state, deleteStateCallback } = props;
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { isMobile } = usePlatformOS();
  // states
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  // derived values
  const isDeleteDisabled = state.default ? true : Boolean(totalStates === 1);

  const handleDeleteState = async () => {
    if (isDeleteDisabled) return;

    setIsDelete(true);

    try {
      await deleteStateCallback(state.id);
      setIsDelete(false);
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      if (errorStatus.status === 400) {
        setToast({
          type: "error",
          title: t("error"),
          message: t(
            "web_ui.this_state_contains_some_work_items_within_it_please_move_them_to_some_other_state_to_dele"
          ),
        });
      } else {
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.state_could_not_be_deleted_please_try_again"),
        });
      }
      setIsDelete(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        handleClose={() => setIsDeleteModal(false)}
        handleSubmit={handleDeleteState}
        isSubmitting={isDelete}
        isOpen={isDeleteModal}
        title={t("web_ui.delete_state")}
        content={
          <>
            {t("web_ui.are_you_sure_you_want_to_delete_state")}{" "}
            <span className="font-medium text-primary">{state?.name}</span>
            {t(
              "web_ui.all_of_the_data_related_to_the_state_will_be_permanently_removed_this_action_cannot_be_und"
            )}{" "}
          </>
        }
      />

      <Tooltip
        label={
          state.default
            ? t("web_ui.cannot_delete_the_default_state")
            : totalStates === 1
              ? t("web_ui.cannot_have_an_empty_group")
              : ``
        }
        layout="stacked"
        disabled={!isDeleteDisabled || isMobile}
      >
        {/* Not `disabled`: a disabled button would never show the tooltip that explains why. */}
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={t("common.delete")}
          aria-disabled={isDeleteDisabled}
          icon={
            isDelete ? (
              <Icon icon={<LoadingOutline className="animate-spin text-secondary" />} />
            ) : (
              <Icon icon={<CloseOutline className={cn({ "text-danger-primary": !isDeleteDisabled })} />} />
            )
          }
          onClick={() => {
            if (isDeleteDisabled) return;
            setIsDeleteModal(true);
          }}
        />
      </Tooltip>
    </>
  );
});
