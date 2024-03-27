import { FC } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { TCycleLayoutOptions } from "@plane/types";
// hooks
// components
import { CyclesBoard, CyclesList, CyclesListGanttChartView } from "@/components/cycles";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "@/components/ui";
import { useCycle, useCycleFilter } from "@/hooks/store";
// assets
import AllFiltersImage from "public/empty-state/cycle/all-filters.svg";
import NameFilterImage from "public/empty-state/cycle/name-filter.svg";
// types

export interface ICyclesView {
  layout: TCycleLayoutOptions;
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
}

export const CyclesView: FC<ICyclesView> = observer((props) => {
  const { layout, workspaceSlug, projectId, peekCycle } = props;
  // store hooks
  const { getFilteredCycleIds, getFilteredCompletedCycleIds, loader } = useCycle();
  const { searchQuery } = useCycleFilter();
  // derived values
  const filteredCycleIds = getFilteredCycleIds(projectId);
  const filteredCompletedCycleIds = getFilteredCompletedCycleIds(projectId);

  if (loader || !filteredCycleIds)
    return (
      <>
        {layout === "list" && <CycleModuleListLayout />}
        {layout === "board" && <CycleModuleBoardLayout />}
        {layout === "gantt" && <GanttLayoutLoader />}
      </>
    );

  if (filteredCycleIds.length === 0 && filteredCompletedCycleIds?.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching cycles"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching cycles</h5>
          <p className="text-custom-text-400 text-base">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all cycles"
              : "Remove the search criteria to see all cycles"}
          </p>
        </div>
      </div>
    );

  return (
    <>
      {layout === "list" && (
        <CyclesList
          completedCycleIds={filteredCompletedCycleIds ?? []}
          cycleIds={filteredCycleIds}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
        />
      )}
      {layout === "board" && (
        <CyclesBoard
          completedCycleIds={filteredCompletedCycleIds ?? []}
          cycleIds={filteredCycleIds}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          peekCycle={peekCycle}
        />
      )}
      {layout === "gantt" && <CyclesListGanttChartView cycleIds={filteredCycleIds} workspaceSlug={workspaceSlug} />}
    </>
  );
});
