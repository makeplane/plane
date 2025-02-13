"use client";

import { FC, useMemo, useState } from "react";
import { EIssuesStoreType } from "@plane/constants";
import { Button, EModalPosition, EModalWidth, Input, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
import { CycleDropdown } from "@/components/dropdowns";
import { useCycle, useIssues } from "@/hooks/store";
import { CYCLE_ACTION } from "@/plane-web/constants/cycle";

type EndCycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  transferrableIssuesCount: number;
  cycleName: string;
};

type LoadingState = "Transferring..." | "Ending Cycle..." | "Completing Cycle ...";

export const EndCycleModal: FC<EndCycleModalProps> = (props) => {
  const { isOpen, handleClose, transferrableIssuesCount, projectId, workspaceSlug, cycleId, cycleName } = props;
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
        <h3 className="text-lg font-medium">
          {completeCycle ? `Sure you want to end this cycle now?` : "Choose what happens to incomplete work items."}
        </h3>
        <p className="text-sm text-custom-text-300 mt-1">
          {completeCycle ? (
            <>
              You can&rsquo;t edit this cycle after it ends and all data in the cycle when you end it will be frozen for
              analytics.
            </>
          ) : (
            <>
              You have <span className="text-custom-80 font-semibold">{transferrableIssuesCount}</span>
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
                <span className="text-custom-100 text-sm">Leave pending work items in this cycle.</span>
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
                <span className="text-custom-100 text-sm">Transfer pending work items to an upcoming cycle.</span>
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
              buttonClassName={`py-1 text-sm justify-between`}
              placeholder="Select Cycle"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5"
              placement="bottom-end"
              currentCycleId={cycleId}
            />
          )}
        </div>
        <div className="mt-2 pt-2 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant={completeCycle ? "primary" : "danger"}
            size="sm"
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
};
