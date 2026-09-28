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
  const isDeleteDisabled = state.default ? true : totalStates === 1 ? true : false;

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
          title: "Error!",
          message:
            "This state contains some work items within it, please move them to some other state to delete this state.",
        });
      } else {
        setToast({
          type: "error",
          title: "Error!",
          message: "State could not be deleted. Please try again.",
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
        title="Delete State"
        content={
          <>
            Are you sure you want to delete state- <span className="font-medium text-primary">{state?.name}</span>? All
            of the data related to the state will be permanently removed. This action cannot be undone.
          </>
        }
      />

      <Tooltip
        label={
          state.default ? "Cannot delete the default state." : totalStates === 1 ? `Cannot have an empty group.` : ``
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
