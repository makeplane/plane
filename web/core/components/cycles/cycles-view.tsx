import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// components
import { CyclesList } from "@/components/cycles";
// ui
import { CycleModuleListLayout } from "@/components/ui";
// hooks
import { useCycle, useCycleFilter } from "@/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/cycle/all-filters.svg";
import NameFilterImage from "@/public/empty-state/cycle/name-filter.svg";

export interface ICyclesView {
  workspaceSlug: string;
  projectId: string;
}

export const CyclesView: FC<ICyclesView> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getFilteredCycleIds, getFilteredCompletedCycleIds, loader, currentProjectActiveCycleId } = useCycle();
  const { searchQuery } = useCycleFilter();
  // derived values
  const filteredCycleIds = getFilteredCycleIds(projectId, false);
  const filteredCompletedCycleIds = getFilteredCompletedCycleIds(projectId);
  const filteredUpcomingCycleIds = (filteredCycleIds ?? []).filter(
    (cycleId) => cycleId !== currentProjectActiveCycleId
  );

  if (loader || !filteredCycleIds) return <CycleModuleListLayout />;

  if (filteredCycleIds.length === 0 && filteredCompletedCycleIds?.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching cycles"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching cycles</h5>
          <p className="text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all cycles"
              : "Remove the search criteria to see all cycles"}
          </p>
        </div>
      </div>
    );

  return (
    <CyclesList
      completedCycleIds={filteredCompletedCycleIds ?? []}
      upcomingCycleIds={filteredUpcomingCycleIds}
      cycleIds={filteredCycleIds}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
    />
  );
});
