// react
import { useState } from "react";
// components
import SingleStat from "components/project/cycles/stats-view/single-stat";
import ConfirmCycleDeletion from "components/project/cycles/confirm-cycle-deletion";
// types
import { ICycle, SelectCycleType } from "types";
import { CompletedCycleIcon, CurrentCycleIcon, UpcomingCycleIcon } from "components/icons";

type TCycleStatsViewProps = {
  cycles: ICycle[];
  setCreateUpdateCycleModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCycle: React.Dispatch<React.SetStateAction<SelectCycleType>>;
  type: "current" | "upcoming" | "completed";
};

const CycleStatsView: React.FC<TCycleStatsViewProps> = ({
  cycles,
  setCreateUpdateCycleModal,
  setSelectedCycle,
  type,
}) => {
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);
  const [selectedCycleForDelete, setSelectedCycleForDelete] = useState<SelectCycleType>();

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
          {type === "upcoming" ? (
            <UpcomingCycleIcon height="56" width="56" />
          ) : type === "completed" ? (
            <CompletedCycleIcon height="56" width="56" />
          ) : (
            <CurrentCycleIcon height="56" width="56" />
          )}
          <h3 className="text-gray-500">
            No {type} {type === "current" ? "cycle" : "cycles"} yet. Create with{" "}
            <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + Q</pre>.
          </h3>
        </div>
      )}
    </>
  );
};

export default CycleStatsView;
