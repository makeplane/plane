import type { FC } from "react";
import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
// assets
import AllFiltersImage from "@/app/assets/empty-state/cycle/all-filters.svg?url";
import NameFilterImage from "@/app/assets/empty-state/cycle/name-filter.svg?url";
// components
import { CyclesList } from "@/components/cycles/list";
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";

export interface ICyclesView {
  workspaceSlug: string;
  projectId: string;
}

export const CyclesView = observer(function CyclesView(props: ICyclesView) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getFilteredCycleIds, getFilteredCompletedCycleIds, loader, currentProjectActiveCycleId } = useCycle();
  const { searchQuery } = useCycleFilter();
  const { t } = useTranslation();
  // derived values
  const filteredCycleIds = getFilteredCycleIds(projectId, false);
  const filteredCompletedCycleIds = getFilteredCompletedCycleIds(projectId);
  const filteredUpcomingCycleIds = (filteredCycleIds ?? []).filter(
    (cycleId) => cycleId !== currentProjectActiveCycleId
  );

  if (loader || !filteredCycleIds) return <CycleModuleListLayoutLoader />;

  if (filteredCycleIds.length === 0 && filteredCompletedCycleIds?.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <img
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48 object-contain"
            alt="No matching cycles"
          />
          <h5 className="mb-1 mt-7 text-18 font-medium">{t("project_cycles.no_matching_cycles")}</h5>
          <p className="text-14 text-placeholder">
            {searchQuery.trim() === ""
              ? t("project_cycles.remove_filters_to_see_all_cycles")
              : t("project_cycles.remove_search_criteria_to_see_all_cycles")}
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
