/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { isPast } from "date-fns";
import { observer } from "mobx-react";
import { AlertCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CheckIcon, CloseIcon, CycleGroupIcon, SearchIcon, TransferIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCycleGroups } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getDate } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";

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
  const { isOpen, handleClose, cycleId, projectId, workspaceSlug, transferrableIssuesCount, cycleName } = props;
  // states
  const [query, setQuery] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { getProjectCycleDetails, fetchAllCycles, fetchCycleDetails } = useCycle();
  const {
    issues: { transferIssuesFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  // derived values
  const projectCycles = getProjectCycleDetails(projectId);

  const targetCycles = projectCycles?.filter((cycle) => {
    if (cycle.id === cycleId) return false;
    const endDate = getDate(cycle.end_date);
    const hasEndDatePassed = endDate && isPast(endDate);
    return !hasEndDatePassed && cycle.status?.toLowerCase() !== "completed";
  });

  const filteredCycles = targetCycles?.filter((cycle) => cycle.name?.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen && workspaceSlug && !projectCycles) fetchAllCycles(workspaceSlug, projectId);
  }, [isOpen, workspaceSlug, projectId, projectCycles, fetchAllCycles]);

  const handleModalClose = () => {
    setQuery("");
    setSelectedCycleId(null);
    handleClose();
  };

  const handleEndCycle = async () => {
    if (!workspaceSlug || !projectId || !cycleId || !selectedCycleId) return;

    setIsTransferring(true);
    try {
      await transferIssuesFromCycle(workspaceSlug, projectId, cycleId, { new_cycle_id: selectedCycleId });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Work items have been transferred successfully",
      });
      // refresh the source and target cycles to update the issue counts
      await Promise.all([
        fetchCycleDetails(workspaceSlug, projectId, cycleId),
        fetchCycleDetails(workspaceSlug, projectId, selectedCycleId),
      ]).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Unable to fetch cycle details",
        });
      });
      handleModalClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Unable to transfer work items. Please try again.",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleModalClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-4 py-5">
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-1">
            <TransferIcon className="w-5 fill-primary" />
            <h4 className="text-18 font-medium text-primary">End cycle</h4>
          </div>
          <button onClick={handleModalClose}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="px-5 text-13 text-secondary">
          {transferrableIssuesCount > 0 ? (
            <>
              <span className="font-medium text-primary">{transferrableIssuesCount}</span> incomplete work item
              {transferrableIssuesCount === 1 ? "" : "s"} in{" "}
              <span className="font-medium break-words text-primary">{cycleName}</span> will be transferred to the cycle
              you select below.
            </>
          ) : (
            <>
              There are no incomplete work items in{" "}
              <span className="font-medium break-words text-primary">{cycleName}</span>. A snapshot of the cycle
              progress will be saved.
            </>
          )}
        </p>
        <div className="flex items-center gap-2 border-b border-subtle px-5 pb-3">
          <SearchIcon className="h-4 w-4 text-secondary" />
          <input
            className="text-13 outline-none"
            placeholder="Search for a cycle..."
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
        </div>
        <div className="flex max-h-60 w-full flex-col items-start gap-2 overflow-y-auto px-5">
          {filteredCycles ? (
            filteredCycles.length > 0 ? (
              filteredCycles.map((cycle) => {
                const cycleStatus = cycle.status ? (cycle.status.toLocaleLowerCase() as TCycleGroups) : "draft";
                const isSelected = selectedCycleId === cycle.id;

                return (
                  <button
                    key={cycle.id}
                    type="button"
                    className={`flex w-full items-center gap-4 rounded-sm px-4 py-3 text-13 text-secondary hover:bg-surface-2 ${
                      isSelected ? "bg-surface-2" : ""
                    }`}
                    onClick={() => setSelectedCycleId(cycle.id)}
                  >
                    <CycleGroupIcon cycleGroup={cycleStatus} className="h-5 w-5 flex-shrink-0" />
                    <div className="flex w-full justify-between gap-2 truncate">
                      <span className="truncate">{cycle.name}</span>
                      {cycle.status && (
                        <span className="flex flex-shrink-0 items-center rounded-full bg-layer-1 px-2 capitalize">
                          {cycle.status.toLocaleLowerCase()}
                        </span>
                      )}
                    </div>
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="flex w-full items-center justify-center gap-4 p-5 text-13">
                <AlertCircle className="h-3.5 w-3.5 text-secondary" />
                <span className="text-center text-secondary">{t("project_cycles.transfer.no_cycles_available")}</span>
              </div>
            )
          ) : (
            <p className="w-full text-center text-13 text-secondary">{t("common.loading")}...</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 pt-4">
          <Button variant="secondary" size="lg" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleEndCycle}
            disabled={!selectedCycleId}
            loading={isTransferring}
          >
            {t("project_cycles.transfer_work_items", { count: transferrableIssuesCount })}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
