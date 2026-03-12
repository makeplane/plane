/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button, CustomSelect } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// types
import type { ICycleIncompleteIssuesResponse } from "@plane/types";

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  transferrableIssuesCount: number;
  cycleName: string;
}

export const EndCycleModal = observer(function EndCycleModal(props: Props) {
  const { isOpen, handleClose, cycleId, projectId, workspaceSlug, cycleName } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [incompleteData, setIncompleteData] = useState<ICycleIncompleteIssuesResponse | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  // hooks
  const { completeCycle, getIncompleteIssues } = useCycle();
  const { t } = useTranslation();

  // Fetch incomplete issues when modal opens
  useEffect(() => {
    if (isOpen && cycleId) {
      setIsFetching(true);
      getIncompleteIssues(workspaceSlug, projectId, cycleId)
        .then((data) => {
          setIncompleteData(data);
        })
        .catch((error) => {
          console.error("Failed to fetch incomplete issues:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [isOpen, cycleId, workspaceSlug, projectId, getIncompleteIssues]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCycleId(null);
      setIncompleteData(null);
    }
  }, [isOpen]);

  const handleCompleteCycle = async (withTransfer: boolean = false) => {
    setIsLoading(true);
    try {
      await completeCycle(
        workspaceSlug,
        projectId,
        cycleId,
        withTransfer && selectedCycleId ? selectedCycleId : undefined
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_cycles.action.complete.success.title") || "Cycle completed",
        message:
          t("project_cycles.action.complete.success.description") || "The cycle has been completed successfully.",
      });
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_cycles.action.complete.failed.title") || "Failed to complete cycle",
        message: error?.error || t("project_cycles.action.complete.failed.description") || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incompleteIssuesCount = incompleteData?.incomplete_issues_count ?? 0;
  const availableCycles = incompleteData?.available_cycles ?? [];

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-custom-text-100">
              {t("project_cycles.action.complete.title") || "Complete Cycle"}
            </h3>
            <p className="mt-1 text-sm text-custom-text-200">
              {t("project_cycles.action.complete.description") ||
                `Are you sure you want to complete the cycle "${cycleName}"?`}
            </p>
          </div>
        </div>

        {isFetching ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-custom-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {incompleteIssuesCount > 0 && (
              <div className="mt-6">
                <div className="rounded-md bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">
                        {t("project_cycles.action.complete.incomplete_issues_warning") ||
                          `${incompleteIssuesCount} incomplete issue${incompleteIssuesCount > 1 ? "s" : ""} found`}
                      </p>
                      <p className="mt-1 text-sm text-custom-text-300">
                        {t("project_cycles.action.complete.incomplete_issues_description") ||
                          "You can transfer these issues to another cycle or complete without transferring."}
                      </p>
                    </div>
                  </div>
                </div>

                {availableCycles.length > 0 && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-custom-text-200">
                      {t("project_cycles.action.complete.transfer_to") || "Transfer issues to"}
                    </label>
                    <CustomSelect
                      value={selectedCycleId}
                      onChange={(value: string) => setSelectedCycleId(value)}
                      label={
                        selectedCycleId
                          ? availableCycles.find((c) => c.id === selectedCycleId)?.name || "Select cycle"
                          : t("project_cycles.action.complete.select_cycle") || "Select a cycle (optional)"
                      }
                      buttonClassName="w-full"
                    >
                      <CustomSelect.Option value={null}>
                        <span className="text-custom-text-300">
                          {t("project_cycles.action.complete.no_transfer") || "Don't transfer issues"}
                        </span>
                      </CustomSelect.Option>
                      {availableCycles.map((cycle) => (
                        <CustomSelect.Option key={cycle.id} value={cycle.id}>
                          <div className="flex items-center gap-2">
                            <span>{cycle.name}</span>
                            {cycle.manual_status === "started" && (
                              <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-500">
                                {t("common.active") || "Active"}
                              </span>
                            )}
                          </div>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-sm text-custom-text-300">
                {incompleteIssuesCount > 0 && selectedCycleId && (
                  <div className="flex items-center gap-2">
                    <span>{incompleteIssuesCount} issues</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>{availableCycles.find((c) => c.id === selectedCycleId)?.name}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={isLoading}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCompleteCycle(!!selectedCycleId)}
                  loading={isLoading}
                >
                  {isLoading
                    ? t("project_cycles.action.complete.loading") || "Completing..."
                    : selectedCycleId
                      ? t("project_cycles.action.complete.button_transfer") || "Complete & Transfer"
                      : t("project_cycles.action.complete.button") || "Complete Cycle"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalCore>
  );
});
