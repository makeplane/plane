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

export interface IArchivedCyclesView {
  workspaceSlug: string;
  projectId: string;
}

export const ArchivedCyclesView: FC<IArchivedCyclesView> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getFilteredArchivedCycleIds, loader } = useCycle();
  const { archivedCyclesSearchQuery } = useCycleFilter();
  // derived values
  const filteredArchivedCycleIds = getFilteredArchivedCycleIds(projectId);

  if (loader || !filteredArchivedCycleIds) return <CycleModuleListLayout />;

  if (filteredArchivedCycleIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={archivedCyclesSearchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching cycles"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching cycles</h5>
          <p className="text-custom-text-400 text-base">
            {archivedCyclesSearchQuery.trim() === ""
              ? "Remove the filters to see all cycles"
              : "Remove the search criteria to see all cycles"}
          </p>
        </div>
      </div>
    );

  return (
    <CyclesList
      completedCycleIds={[]}
      cycleIds={filteredArchivedCycleIds}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      isArchived
    />
  );
});
