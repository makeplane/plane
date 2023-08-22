import React, { useState } from "react";

import { useRouter } from "next/router";

import { KeyedMutator, mutate } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
import useLocalStorage from "hooks/use-local-storage";
// components
import {
  CreateUpdateCycleModal,
  CyclesListGanttChartView,
  DeleteCycleModal,
  SingleCycleCard,
  SingleCycleList,
} from "components/cycles";
// ui
import { Loader } from "components/ui";
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
  mutateCycles: KeyedMutator<ICycle[]>;
  viewType: string | null;
};

export const CyclesView: React.FC<Props> = ({ cycles, mutateCycles, viewType }) => {
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);
  const [selectedCycleToUpdate, setSelectedCycleToUpdate] = useState<ICycle | null>(null);

  const [deleteCycleModal, setDeleteCycleModal] = useState(false);
  const [selectedCycleToDelete, setSelectedCycleToDelete] = useState<ICycle | null>(null);

  const { storedValue: cycleTab } = useLocalStorage("cycleTab", "All");

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
            <div className="divide-y divide-custom-border-200">
              {cycles.map((cycle) => (
                <div className="hover:bg-custom-background-80">
                  <div className="flex flex-col border-custom-border-200">
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
            <CyclesListGanttChartView cycles={cycles ?? []} mutateCycles={mutateCycles} />
          )
        ) : (
          <div className="h-full grid place-items-center text-center">
            <div className="space-y-2">
              <div className="mx-auto flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="66"
                  height="66"
                  viewBox="0 0 66 66"
                  fill="none"
                >
                  <circle
                    cx="34.375"
                    cy="34.375"
                    r="22"
                    stroke="rgb(var(--color-text-400))"
                    stroke-linecap="round"
                  />
                  <path
                    d="M36.4375 20.9919C36.4375 19.2528 37.6796 17.8127 39.1709 18.1419C40.125 18.3526 41.0604 18.6735 41.9625 19.1014C43.7141 19.9322 45.3057 21.1499 46.6464 22.685C47.987 24.2202 49.0505 26.0426 49.776 28.0484C50.5016 30.0541 50.875 32.2038 50.875 34.3748C50.875 36.5458 50.5016 38.6956 49.776 40.7013C49.0505 42.7071 47.987 44.5295 46.6464 46.0647C45.3057 47.5998 43.7141 48.8175 41.9625 49.6483C41.0604 50.0762 40.125 50.3971 39.1709 50.6077C37.6796 50.937 36.4375 49.4969 36.4375 47.7578L36.4375 20.9919Z"
                    fill="rgb(var(--color-text-400))"
                  />
                </svg>
              </div>
              <h4 className="text-sm text-custom-text-200">
                {cycleTab === "All"
                  ? "No cycles"
                  : `No ${cycleTab === "Drafts" ? "draft" : cycleTab?.toLowerCase()} cycles`}
              </h4>
              <button
                type="button"
                className="text-custom-primary-100 text-sm outline-none"
                onClick={() => {
                  const e = new KeyboardEvent("keydown", {
                    key: "q",
                  });
                  document.dispatchEvent(e);
                }}
              >
                Create a new cycle
              </button>
            </div>
          </div>
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
