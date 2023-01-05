// react
import { useState } from "react";
// components
import SingleStat from "components/project/cycles/stats-view/single-stat";
import ConfirmCycleDeletion from "components/project/cycles/confirm-cycle-deletion";
// types
import { ICycle, SelectSprintType } from "types";
import { CyclesIcon } from "ui/icons";

type TCycleStatsViewProps = {
  cycles: ICycle[];
  setCreateUpdateCycleModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCycle: React.Dispatch<React.SetStateAction<SelectSprintType>>;
  type: "current" | "upcoming" | "completed";
};

const CycleStatsView: React.FC<TCycleStatsViewProps> = ({
  cycles,
  setCreateUpdateCycleModal,
  setSelectedCycle,
  type,
}) => {
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);
  const [selectedCycleForDelete, setSelectedCycleForDelete] = useState<SelectSprintType>();

  const handleDeleteCycle = (cycle: ICycle) => {
    setSelectedCycleForDelete({ ...cycle, actionType: "delete" });
    setCycleDeleteModal(true);
  };

  const handleEditCycle = (cycle: ICycle) => {
    setSelectedCycle({ ...cycle, actionType: "edit" });
    setCreateUpdateCycleModal(true);
  };

  return (
    <>
      <ConfirmCycleDeletion
        isOpen={
          cycleDeleteModal &&
          !!selectedCycleForDelete &&
          selectedCycleForDelete.actionType === "delete"
        }
        setIsOpen={setCycleDeleteModal}
        data={selectedCycleForDelete}
      />
      {cycles.length > 0 ? (
        cycles.map((cycle) => (
          <SingleStat
            key={cycle.id}
            cycle={cycle}
            handleDeleteCycle={() => handleDeleteCycle(cycle)}
            handleEditCycle={() => handleEditCycle(cycle)}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <CyclesIcon className="h-14 w-14" color="gray" />
          <h3>
            Your {type} {type === "current" ? "cycle" : "cycles"} will be represented here
          </h3>
        </div>
      )}
    </>
  );
};

export default CycleStatsView;
