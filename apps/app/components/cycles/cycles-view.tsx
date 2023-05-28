import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  CreateUpdateCycleModal,
  CyclesListGanttChartView,
  DeleteCycleModal,
  SingleCycleCard,
  SingleCycleList,
} from "components/cycles";
// ui
import { EmptyState, Loader } from "components/ui";
// images
import emptyCycle from "public/empty-state/empty-cycle.svg";
// helpers
import { getDateRangeStatus } from "helpers/date-time.helper";
// types
import { ICycle } from "types";
// fetch-keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_LIST,
  CYCLE_DRAFT_LIST,
  CYCLE_LIST,
  CYCLE_UPCOMING_LIST,
} from "constants/fetch-keys";

type Props = {
  cycles: ICycle[] | undefined;
  viewType: string | null;
};

export const CyclesView: React.FC<Props> = ({ cycles, viewType }) => {
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);
  const [selectedCycleToUpdate, setSelectedCycleToUpdate] = useState<ICycle | null>(null);

  const [deleteCycleModal, setDeleteCycleModal] = useState(false);
  const [selectedCycleToDelete, setSelectedCycleToDelete] = useState<ICycle | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleEditCycle = (cycle: ICycle) => {
    setSelectedCycleToUpdate(cycle);
    setCreateUpdateCycleModal(true);
  };

  const handleDeleteCycle = (cycle: ICycle) => {
    setSelectedCycleToDelete(cycle);
    setDeleteCycleModal(true);
  };

  const handleAddToFavorites = (cycle: ICycle) => {
    if (!workspaceSlug || !projectId) return;

    const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

    const fetchKey =
      cycleStatus === "current"
        ? CYCLE_CURRENT_LIST(projectId as string)
        : cycleStatus === "upcoming"
        ? CYCLE_UPCOMING_LIST(projectId as string)
        : cycleStatus === "completed"
        ? CYCLE_COMPLETE_LIST(projectId as string)
        : CYCLE_DRAFT_LIST(projectId as string);

    mutate<ICycle[]>(
      fetchKey,
      (prevData) =>
        (prevData ?? []).map((c) => ({
          ...c,
          is_favorite: c.id === cycle.id ? true : c.is_favorite,
        })),
      false
    );

    mutate(
      CYCLE_LIST(projectId as string),
      (prevData: any) =>
        (prevData ?? []).map((c: any) => ({
          ...c,
          is_favorite: c.id === cycle.id ? true : c.is_favorite,
        })),
      false
    );

    cyclesService
      .addCycleToFavorites(workspaceSlug as string, projectId as string, {
        cycle: cycle.id,
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the cycle to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = (cycle: ICycle) => {
    if (!workspaceSlug || !projectId) return;

    const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

    const fetchKey =
      cycleStatus === "current"
        ? CYCLE_CURRENT_LIST(projectId as string)
        : cycleStatus === "upcoming"
        ? CYCLE_UPCOMING_LIST(projectId as string)
        : cycleStatus === "completed"
        ? CYCLE_COMPLETE_LIST(projectId as string)
        : CYCLE_DRAFT_LIST(projectId as string);

    mutate<ICycle[]>(
      fetchKey,
      (prevData) =>
        (prevData ?? []).map((c) => ({
          ...c,
          is_favorite: c.id === cycle.id ? false : c.is_favorite,
        })),
      false
    );

    mutate(
      CYCLE_LIST(projectId as string),
      (prevData: any) =>
        (prevData ?? []).map((c: any) => ({
          ...c,
          is_favorite: c.id === cycle.id ? false : c.is_favorite,
        })),
      false
    );

    cyclesService
      .removeCycleFromFavorites(workspaceSlug as string, projectId as string, cycle.id)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the cycle from favorites. Please try again.",
        });
      });
  };

  return (
    <>
      <CreateUpdateCycleModal
        isOpen={createUpdateCycleModal}
        handleClose={() => setCreateUpdateCycleModal(false)}
        data={selectedCycleToUpdate}
      />
      <DeleteCycleModal
        isOpen={deleteCycleModal}
        setIsOpen={setDeleteCycleModal}
        data={selectedCycleToDelete}
      />
      {cycles ? (
        cycles.length > 0 ? (
          viewType === "list" ? (
            <div className="divide-y divide-brand-base">
              {cycles.map((cycle) => (
                <div className="hover:bg-brand-surface-2">
                  <div className="flex flex-col border-brand-base">
                    <SingleCycleList
                      key={cycle.id}
                      cycle={cycle}
                      handleDeleteCycle={() => handleDeleteCycle(cycle)}
                      handleEditCycle={() => handleEditCycle(cycle)}
                      handleAddToFavorites={() => handleAddToFavorites(cycle)}
                      handleRemoveFromFavorites={() => handleRemoveFromFavorites(cycle)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : viewType === "board" ? (
            <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
              {cycles.map((cycle) => (
                <SingleCycleCard
                  key={cycle.id}
                  cycle={cycle}
                  handleDeleteCycle={() => handleDeleteCycle(cycle)}
                  handleEditCycle={() => handleEditCycle(cycle)}
                  handleAddToFavorites={() => handleAddToFavorites(cycle)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(cycle)}
                />
              ))}
            </div>
          ) : (
            <CyclesListGanttChartView cycles={cycles ?? []} />
          )
        ) : (
          <EmptyState
            type="cycle"
            title="Create New Cycle"
            description="Sprint more effectively with Cycles by confining your project to a fixed amount of time. Create new cycle now."
            imgURL={emptyCycle}
          />
        )
      ) : viewType === "list" ? (
        <Loader className="space-y-4">
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
        </Loader>
      ) : viewType === "board" ? (
        <Loader className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
          <Loader.Item height="200px" />
          <Loader.Item height="200px" />
          <Loader.Item height="200px" />
        </Loader>
      ) : (
        <Loader>
          <Loader.Item height="300px" />
        </Loader>
      )}
    </>
  );
};
