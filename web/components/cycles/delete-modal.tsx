import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { ICycle } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore } from "@/components/core";
// constants
import { CYCLE_DELETED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useCycle } from "@/hooks/store";

interface ICycleDelete {
  cycle: ICycle;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  projectId: string;
}

export const CycleDeleteModal: React.FC<ICycleDelete> = observer((props) => {
  const { isOpen, handleClose, cycle, workspaceSlug, projectId } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { captureCycleEvent } = useEventTracker();
  const { deleteCycle } = useCycle();
  // router
  const router = useRouter();
  const { cycleId, peekCycle } = router.query;

  const formSubmit = async () => {
    if (!cycle) return;

    setLoader(true);
    try {
      await deleteCycle(workspaceSlug, projectId, cycle.id)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Cycle deleted successfully.",
          });
          captureCycleEvent({
            eventName: CYCLE_DELETED,
            payload: { ...cycle, state: "SUCCESS" },
          });
        })
        .catch(() => {
          captureCycleEvent({
            eventName: CYCLE_DELETED,
            payload: { ...cycle, state: "FAILED" },
          });
        });

      if (cycleId || peekCycle) router.push(`/${workspaceSlug}/projects/${projectId}/cycles`);

      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: "Something went wrong please try again later.",
      });
    }

    setLoader(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isDeleting={loader}
      isOpen={isOpen}
      title="Delete Cycle"
      content={
        <>
          Are you sure you want to delete cycle{' "'}
          <span className="break-words font-medium text-custom-text-100">{cycle?.name}</span>
          {'"'}? All of the data related to the cycle will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
