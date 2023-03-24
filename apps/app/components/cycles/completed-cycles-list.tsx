import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import cyclesService from "services/cycles.service";
// components
import { DeleteCycleModal, SingleCycleCard } from "components/cycles";
// icons
import { CompletedCycleIcon } from "components/icons";
// types
import { ICycle, SelectCycleType } from "types";
// fetch-keys
import { CYCLE_COMPLETE_LIST } from "constants/fetch-keys";
import { EmptyState, Loader } from "components/ui";
// image
import emptyCycle from "public/empty-state/empty-cycle.svg";

export interface CompletedCyclesListProps {
  setCreateUpdateCycleModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCycle: React.Dispatch<React.SetStateAction<SelectCycleType>>;
}

export const CompletedCyclesList: React.FC<CompletedCyclesListProps> = ({
  setCreateUpdateCycleModal,
  setSelectedCycle,
}) => {
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);
  const [selectedCycleForDelete, setSelectedCycleForDelete] = useState<SelectCycleType>();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: completedCycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_COMPLETE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cyclesService.getCompletedCycles(workspaceSlug as string, projectId as string)
      : null
  );

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
      <DeleteCycleModal
        isOpen={
          cycleDeleteModal &&
          !!selectedCycleForDelete &&
          selectedCycleForDelete.actionType === "delete"
        }
        setIsOpen={setCycleDeleteModal}
        data={selectedCycleForDelete}
      />
      {completedCycles ? (
        completedCycles.completed_cycles.length > 0 ? (
          <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
            {completedCycles.completed_cycles.map((cycle) => (
              <SingleCycleCard
                key={cycle.id}
                cycle={cycle}
                handleDeleteCycle={() => handleDeleteCycle(cycle)}
                handleEditCycle={() => handleEditCycle(cycle)}
                isCompleted
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="cycle"
            title="Create New Cycle"
            description="Sprint more effectively with Cycles by confining your project
          to a fixed amount of time. Create new cycle now."
            imgURL={emptyCycle}
          />
        )
      ) : (
        <Loader className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
          <Loader.Item height="200px" />
          <Loader.Item height="200px" />
          <Loader.Item height="200px" />
        </Loader>
      )}
    </>
  );
};
