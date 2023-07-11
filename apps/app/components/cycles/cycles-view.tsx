import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
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
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyCycle from "public/empty-state/cycle.svg";
// helpers
import { getDateRangeStatus } from "helpers/date-time.helper";
// types
import { ICycle } from "types";
// fetch-keys
import {
  COMPLETED_CYCLES_LIST,
  CURRENT_CYCLE_LIST,
  CYCLES_LIST,
  DRAFT_CYCLES_LIST,
  UPCOMING_CYCLES_LIST,
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

  const { user } = useUserAuth();
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
        ? CURRENT_CYCLE_LIST(projectId as string)
        : cycleStatus === "upcoming"
        ? UPCOMING_CYCLES_LIST(projectId as string)
        : cycleStatus === "completed"
        ? COMPLETED_CYCLES_LIST(projectId as string)
        : DRAFT_CYCLES_LIST(projectId as string);

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
      CYCLES_LIST(projectId as string),
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
        ? CURRENT_CYCLE_LIST(projectId as string)
        : cycleStatus === "upcoming"
        ? UPCOMING_CYCLES_LIST(projectId as string)
        : cycleStatus === "completed"
        ? COMPLETED_CYCLES_LIST(projectId as string)
        : DRAFT_CYCLES_LIST(projectId as string);

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
      CYCLES_LIST(projectId as string),
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
        user={user}
      />
      <DeleteCycleModal
        isOpen={deleteCycleModal}
        setIsOpen={setDeleteCycleModal}
        data={selectedCycleToDelete}
        user={user}
      />
      {cycles ? (
        cycles.length > 0 ? (
          viewType === "list" ? (
            <div className="divide-y divide-custom-border-100">
              {cycles.map((cycle) => (
                <div className="hover:bg-custom-background-80">
                  <div className="flex flex-col border-custom-border-100">
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
            title="Plan your project with cycles"
            description="Cycle is a custom time period in which a team works to complete items on their backlog."
            image={emptyCycle}
            buttonText="New Cycle"
            buttonIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "q",
              });
              document.dispatchEvent(e);
            }}
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
