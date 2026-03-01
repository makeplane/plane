/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo, useState } from "react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

import { EIssuesStoreType } from "@plane/types";
// plane imports
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// components
import { CycleDropdown } from "@/components/dropdowns/cycle";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { CYCLE_ACTION } from "@/constants/cycle";

type EndCycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  transferrableIssuesCount: number;
};

type LoadingState = "Transferring..." | "Ending Cycle..." | "Completing Cycle ...";

export function EndCycleModal(props: EndCycleModalProps) {
  const { isOpen, handleClose, transferrableIssuesCount, projectId, workspaceSlug, cycleId } = props;
  const [transferIssues, setTransferIssues] = useState<boolean>(false);
  const [targetCycle, setTargetCycle] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  const { updateCycleStatus, fetchActiveCycleProgress } = useCycle();

  const completeCycle = useMemo(() => transferrableIssuesCount === 0, [transferrableIssuesCount]);

  const {
    issues: { transferIssuesFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  const handleSubmit = async () => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    setLoadingState(completeCycle ? "Completing Cycle ..." : "Ending Cycle...");
    await updateCycleStatus(workspaceSlug, projectId, cycleId, CYCLE_ACTION.STOP)
      .then(async () => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Cycle ${completeCycle ? "completed" : "ended"} successfully.`,
        });
        if (transferIssues && targetCycle) await handleTransferIssues(targetCycle);
        handleClose();
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err.error || `Unable to ${completeCycle ? "complete" : "end"} Cycle. Please try again.`,
        });
      })
      .finally(() => {
        setLoadingState(null);
      });
  };

  const handleTransferIssues = async (newCycleId: string) => {
    setLoadingState("Transferring...");
    await transferIssuesFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), {
      new_cycle_id: newCycleId,
    })
      .then(async () => {
        await getCycleDetails(newCycleId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work items have been transferred successfully",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Work items cannot be transfer. Please try again.",
        });
      })
      .finally(() => {
        setLoadingState(null);
      });
  };

  /**To update issue counts in target cycle and current cycle */
  const getCycleDetails = async (newCycleId: string) => {
    const cyclesFetch = [
      fetchActiveCycleProgress(workspaceSlug.toString(), projectId.toString(), cycleId),
      fetchActiveCycleProgress(workspaceSlug.toString(), projectId.toString(), newCycleId),
    ];
    await Promise.all(cyclesFetch).catch((error) => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error.error || "Unable to fetch cycle details",
      });
    });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.LG}>
      <div className="p-4">
        <h3 className="text-16 font-medium">
          {completeCycle ? `Sure you want to end this cycle now?` : "Choose what happens to incomplete work items."}
        </h3>
        <p className="text-13 text-tertiary mt-1">
          {completeCycle ? (
            <>
              You can&rsquo;t edit this cycle after it ends and all data in the cycle when you end it will be frozen for
              analytics.
            </>
          ) : (
            <>
              You have <span className="font-semibold">{transferrableIssuesCount}</span>
              &nbsp;incomplete work items in this cycle that you can move to an upcoming cycle or leave as-is in this
              one.
            </>
          )}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {!completeCycle && (
            <>
              <div className="flex gap-1 mb-1">
                <Input
                  type="radio"
                  name="transfer_cycle"
                  className="cursor-pointer"
                  checked={!transferIssues}
                  onChange={() => setTransferIssues(false)}
                  {...props}
                />
                <span className="text-13">Leave pending work items in this cycle.</span>
              </div>
              <div className="flex gap-1">
                <Input
                  type="radio"
                  name="transfer_cycle"
                  className="cursor-pointer"
                  checked={transferIssues}
                  onChange={() => setTransferIssues(true)}
                  {...props}
                />
                <span className="text-13">Transfer pending work items to an upcoming cycle.</span>
              </div>
            </>
          )}
          {transferIssues && (
            <CycleDropdown
              value={targetCycle}
              onChange={setTargetCycle}
              projectId={projectId}
              buttonVariant="transparent-with-text"
              className="group"
              buttonContainerClassName="w-full border text-left rounded"
              buttonClassName={`py-1 text-13 justify-between`}
              placeholder="Select Cycle"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5"
              placement="bottom-end"
              currentCycleId={cycleId}
            />
          )}
        </div>
        <div className="mt-2 pt-2 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle-1">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant={completeCycle ? "primary" : "error-fill"}
            type="submit"
            disabled={!!loadingState}
            onClick={handleSubmit}
          >
            {loadingState ? loadingState : completeCycle ? "Let's do it" : "End Cycle"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
