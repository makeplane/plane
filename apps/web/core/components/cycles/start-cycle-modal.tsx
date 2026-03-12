/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  cycleName: string;
}

export const StartCycleModal = observer(function StartCycleModal(props: Props) {
  const { isOpen, handleClose, cycleId, projectId, workspaceSlug, cycleName } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  // hooks
  const { startCycle, currentProjectActiveCycleId, getCycleById } = useCycle();
  const { t } = useTranslation();

  // Check if there's already an active cycle
  const activeCycle = currentProjectActiveCycleId ? getCycleById(currentProjectActiveCycleId) : null;
  const hasActiveCycle = !!activeCycle && activeCycle.id !== cycleId;

  const handleStartCycle = async () => {
    setIsLoading(true);
    try {
      await startCycle(workspaceSlug, projectId, cycleId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_cycles.action.start.success.title") || "Cycle started",
        message: t("project_cycles.action.start.success.description") || "The cycle has been started successfully.",
      });
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_cycles.action.start.failed.title") || "Failed to start cycle",
        message: error?.error || t("project_cycles.action.start.failed.description") || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10">
            <AlertTriangle className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-custom-text-100">
              {t("project_cycles.action.start.title") || "Start Cycle"}
            </h3>
            <p className="mt-1 text-sm text-custom-text-200">
              {t("project_cycles.action.start.description") ||
                `Are you sure you want to start the cycle "${cycleName}"?`}
            </p>
            {hasActiveCycle && (
              <div className="mt-3 rounded-md bg-amber-500/10 p-3">
                <p className="text-sm text-amber-500">
                  <strong>{t("common.warning") || "Warning"}:</strong>{" "}
                  {t("project_cycles.action.start.active_cycle_warning") ||
                    `There is already an active cycle "${activeCycle?.name}" in this project. Starting this cycle may cause conflicts.`}
                </p>
              </div>
            )}
            <p className="mt-3 text-sm text-custom-text-300">
              {t("project_cycles.action.start.info") ||
                "Once started, this cycle will become the active cycle for the project."}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={isLoading}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button variant="primary" size="sm" onClick={handleStartCycle} loading={isLoading} disabled={hasActiveCycle}>
            {isLoading
              ? t("project_cycles.action.start.loading") || "Starting..."
              : t("project_cycles.action.start.button") || "Start Cycle"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
