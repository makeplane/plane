/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import { DefaultTabOutline, DeleteOutline, EditOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateOperationsCallbacks } from "@plane/types";

type TStateQuickActions = {
  totalStates: number;
  state: IState;
  onEdit: () => void;
  stateOperationsCallbacks: Pick<TStateOperationsCallbacks, "markStateAsDefault" | "deleteState">;
};

/** The state row's "…" menu: edit, mark as default, and delete behind a confirmation. */
export const StateQuickActions = observer(function StateQuickActions(props: TStateQuickActions) {
  const { totalStates, state, onEdit, stateOperationsCallbacks } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingAsDefault, setIsMarkingAsDefault] = useState(false);
  // derived values
  const isDeleteDisabled = !!state.default || totalStates === 1;
  const deleteDisabledReason = state.default
    ? "Cannot delete the default state."
    : totalStates === 1
      ? "Cannot have an empty group."
      : undefined;

  const handleMarkAsDefault = async () => {
    if (state.default || isMarkingAsDefault) return;
    setIsMarkingAsDefault(true);
    try {
      await stateOperationsCallbacks.markStateAsDefault(state.id);
    } catch {
      // a failed update leaves the current default in place
    } finally {
      setIsMarkingAsDefault(false);
    }
  };

  const handleDeleteState = async () => {
    if (isDeleteDisabled) return;
    setIsDeleting(true);
    try {
      await stateOperationsCallbacks.deleteState(state.id);
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      setToast({
        type: "error",
        title: "Error!",
        message:
          errorStatus.status === 400
            ? "This state contains some work items within it, please move them to some other state to delete this state."
            : "State could not be deleted. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDeleteState}
        isSubmitting={isDeleting}
        isOpen={isDeleteModalOpen}
        title="Delete State"
        content={
          <>
            Are you sure you want to delete state- <span className="font-medium text-primary">{state?.name}</span>? All
            of the data related to the state will be permanently removed. This action cannot be undone.
          </>
        }
      />
      <Menu>
        <MenuTrigger
          render={
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("aria_labels.common.more_actions")}
              icon={<Icon icon={MoreHorizontalOutline} />}
            />
          }
        />
        <MenuContent side="bottom" align="end">
          <MenuItem icon={<Icon icon={EditOutline} />} label={t("common.actions.edit")} onClick={onEdit} />
          {!state.default && (
            <MenuItem
              icon={<Icon icon={DefaultTabOutline} />}
              label={isMarkingAsDefault ? "Marking as default" : "Mark as default"}
              disabled={isMarkingAsDefault}
              onClick={() => void handleMarkAsDefault()}
            />
          )}
          <MenuSeparator />
          <MenuItem
            variant="danger"
            icon={<Icon icon={DeleteOutline} />}
            label={t("common.actions.delete")}
            description={deleteDisabledReason}
            disabled={isDeleteDisabled}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </MenuContent>
      </Menu>
    </>
  );
});
