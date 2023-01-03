// react
import { useState } from "react";
// components
import SingleStat from "components/project/cycles/stats-view/single-stat";
import ConfirmCycleDeletion from "components/project/cycles/confirm-cycle-deletion";
// types
import { ICycle, SelectSprintType } from "types";

type TCycleStatsViewProps = {
  cycles: ICycle[];
  setCreateUpdateCycleModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCycle: React.Dispatch<React.SetStateAction<SelectSprintType>>;
};

const CycleStatsView: React.FC<TCycleStatsViewProps> = (props) => {
  const { cycles, setCreateUpdateCycleModal, setSelectedCycle } = props;

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
      {cycles.map((cycle) => (
        <SingleStat
          key={cycle.id}
          cycle={cycle}
          handleDeleteCycle={() => handleDeleteCycle(cycle)}
          handleEditCycle={() => handleEditCycle(cycle)}
        />
      ))}
    </>
  );
};

export default CycleStatsView;
