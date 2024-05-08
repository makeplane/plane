import { FC } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
// types
import { TCycleLayoutOptions } from "@plane/types";
// components
import { CyclesBoard, CyclesList, CyclesListGanttChartView } from "@/components/cycles";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "@/components/ui";
// hooks
import { useCycle, useCycleFilter } from "@/hooks/store";
// assets
import AllFiltersImage from "public/empty-state/cycle/all-filters.svg";
import NameFilterImage from "public/empty-state/cycle/name-filter.svg";

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
  const filteredCycleIds = getFilteredCycleIds(projectId, layout === "gantt");
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
