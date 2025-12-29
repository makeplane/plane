import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { SearchIcon, CycleIcon, TransferIcon, CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
};

export const TransferIssuesModal = observer(function TransferIssuesModal(props: Props) {
  const { isOpen, handleClose, cycleId } = props;
  // states
  const [query, setQuery] = useState("");

  // store hooks
  const { currentProjectIncompleteCycleIds, getCycleById, fetchActiveCycleProgress } = useCycle();
  const {
    issues: { transferIssuesFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  const { workspaceSlug, projectId } = useParams();

  const transferIssue = async (payload: { new_cycle_id: string }) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    await transferIssuesFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), payload)
      .then(async () => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work items have been transferred successfully",
        });
        await getCycleDetails(payload.new_cycle_id);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Unable to transfer work items. Please try again.",
        });
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

  const filteredOptions = currentProjectIncompleteCycleIds?.filter((optionId) => {
    const cycleDetails = getCycleById(optionId);

    return cycleDetails?.name?.toLowerCase().includes(query?.toLowerCase());
  });

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-4 py-5">
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-1">
            <TransferIcon className="w-5 fill-primary" />
            <h4 className="text-18 font-medium text-primary">Transfer work items</h4>
          </div>
          <button onClick={handleClose}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-subtle px-5 pb-3">
          <SearchIcon className="h-4 w-4 text-secondary" />
          <input
            className="outline-none text-13"
            placeholder="Search for a cycle..."
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
        </div>
        <div className="flex w-full flex-col items-start gap-2 px-5">
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              filteredOptions.map((optionId) => {
                const cycleDetails = getCycleById(optionId);

                if (!cycleDetails) return;

                return (
                  <button
                    key={optionId}
                    className="flex w-full items-center gap-4 rounded-sm px-4 py-3 text-13 text-secondary hover:bg-surface-2"
                    onClick={() => {
                      transferIssue({
                        new_cycle_id: optionId,
                      });
                      handleClose();
                    }}
                  >
                    <CycleIcon className="h-5 w-5" />
                    <div className="flex w-full justify-between truncate">
                      <span className="truncate">{cycleDetails?.name}</span>
                      {cycleDetails.status && (
                        <span className="flex-shrink-0 flex items-center rounded-full bg-layer-1  px-2 capitalize">
                          {cycleDetails.status.toLocaleLowerCase()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex w-full items-center justify-center gap-4 p-5 text-13">
                <AlertCircle className="h-3.5 w-3.5 text-secondary" />
                <span className="text-center text-secondary">
                  You don’t have any current cycle. Please create one to transfer the work items.
                </span>
              </div>
            )
          ) : (
            <p className="text-center text-secondary">Loading...</p>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
