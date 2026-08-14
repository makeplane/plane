/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, ToggleSwitch } from "@plane/ui";
import { propagateStateStore } from "@/store/issue/propagate-state.store";

export const PropagateStateModalRoot = observer(function PropagateStateModalRoot() {
  const { t } = useTranslation();
  const { promptData, propagateToSubIssues, isSubmitting } = propagateStateStore;

  if (!promptData) return null;

  const handleClose = () => {
    propagateStateStore.cancel();
  };

  const handleSubmit = () => {
    propagateStateStore.confirm();
  };

  return (
    <AlertModalCore
      isOpen
      variant="primary"
      title={t("sub_work_item.propagate_state.modal.title")}
      content={
        <div className="space-y-4">
          <p className="text-body-sm-regular text-secondary">
            {t("sub_work_item.propagate_state.modal.description", { count: promptData.subIssuesCount })}
          </p>
          <div className="flex items-center justify-between gap-3 rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
            <span className="text-body-sm-medium text-primary">{t("sub_work_item.propagate_state.modal.toggle")}</span>
            <ToggleSwitch
              value={propagateToSubIssues}
              onChange={(value) => propagateStateStore.setPropagateToSubIssues(value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      }
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      primaryButtonText={{
        loading: t("common.updating"),
        default: t("common.update"),
      }}
      secondaryButtonText={t("common.cancel")}
    />
  );
});
