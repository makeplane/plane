import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useCycle } from "@/hooks/store/use-cycle";
import { StartCycleModal } from "@/plane-web/components/cycles";
import { CYCLE_ACTION } from "@/plane-web/constants/cycle";
import { useFlag } from "@/plane-web/hooks/store";
type Props = {
  cycleId: string;
  projectId: string;
};
export const CycleAdditionalActions: FC<Props> = observer((props) => {
  //props
  const { projectId, cycleId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [startCycleModalOpen, setStartCycleModal] = useState(false);
  const [startingCycle, setStartingCycle] = useState(false);
  // store hooks
  const { isNextCycle, updateCycleStatus } = useCycle();
  const isEndCycleEnabled = useFlag(workspaceSlug?.toString(), "CYCLE_MANUAL_START_STOP");

  const handleStartCycle = async () => {
    setStartingCycle(true);
    try {
      await updateCycleStatus(workspaceSlug.toString(), projectId, cycleId, CYCLE_ACTION.START);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Cycle started successfully",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        message: error?.error || "Failed to start cycle",
        title: "Error",
      });
    } finally {
      setStartCycleModal(false);
      setStartingCycle(false);
    }
  };

  if (!isNextCycle(projectId, cycleId) || !isEndCycleEnabled) return <></>;

  return (
    <>
      <StartCycleModal
        handleClose={() => setStartCycleModal(false)}
        isOpen={startCycleModalOpen}
        handleStartCycle={handleStartCycle}
        loading={startingCycle}
      />
      <button
        className="rounded-md px-2 h-6 bg-custom-primary-100/20 text-custom-primary-100 hover:bg-custom-primary-100/10 hover:text-custom-primary-200 focus:bg-custom-primary-100/10"
        onClick={() => setStartCycleModal(true)}
      >
        Start cycle
      </button>
    </>
  );
});
