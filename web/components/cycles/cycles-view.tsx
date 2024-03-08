import { FC } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
// hooks
import { useCycle } from "hooks/store";
import useCycleFilters from "hooks/use-cycle-filters";
// components
import { CyclesBoard, CyclesList, CyclesListGanttChartView } from "components/cycles";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "components/ui";
// assets
import NameFilterImage from "public/empty-state/cycle/name-filter.svg";
import AllFiltersImage from "public/empty-state/cycle/all-filters.svg";
// types
import { TCycleLayoutOptions } from "@plane/types";

export interface ICyclesView {
  layout: TCycleLayoutOptions;
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
  searchQuery: string;
}

export const CyclesView: FC<ICyclesView> = observer((props) => {
  const { layout, workspaceSlug, projectId, peekCycle, searchQuery } = props;
  // store hooks
  const { getFilteredCycleIds, loader } = useCycle();
  // cycle filters hook
  const { displayFilters, filters } = useCycleFilters(projectId);
  // derived values
  const filteredCycleIds = getFilteredCycleIds(displayFilters ?? {}, filters ?? {}, searchQuery);

  if (loader || !filteredCycleIds)
    return (
      <>
        {layout === "list" && <CycleModuleListLayout />}
        {layout === "board" && <CycleModuleBoardLayout />}
        {layout === "gantt" && <GanttLayoutLoader />}
      </>
    );

  if (filteredCycleIds.length === 0)
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
        <CyclesList cycleIds={filteredCycleIds} workspaceSlug={workspaceSlug} projectId={projectId} />
      )}

      {layout === "board" && (
        <CyclesBoard
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
