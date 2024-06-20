import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// types
import { TCycleFilters } from "@plane/types";
// components
import { ArchivedCyclesView, CycleAppliedFiltersList } from "@/components/cycles";
import { EmptyState } from "@/components/empty-state";
import { CycleModuleListLayout } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useCycle, useCycleFilter } from "@/hooks/store";

export const ArchivedCycleLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { fetchArchivedCycles, currentProjectArchivedCycleIds, loader } = useCycle();
  // cycle filters hook
  const { clearAllFilters, currentProjectArchivedFilters, updateFilters } = useCycleFilter();
  // derived values
  const totalArchivedCycles = currentProjectArchivedCycleIds?.length ?? 0;

  useSWR(
    workspaceSlug && projectId ? `ARCHIVED_CYCLES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await fetchArchivedCycles(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleRemoveFilter = (key: keyof TCycleFilters, value: string | null) => {
    if (!projectId) return;
    let newValues = currentProjectArchivedFilters?.[key] ?? [];

    if (!value) newValues = [];
    else newValues = newValues.filter((val) => val !== value);

    updateFilters(projectId.toString(), { [key]: newValues }, "archived");
  };

  if (!workspaceSlug || !projectId) return <></>;

  if (loader || !currentProjectArchivedCycleIds) {
    return <CycleModuleListLayout />;
  }

  return (
    <>
      {calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0 && (
        <div className="border-b border-custom-border-200 px-5 py-3">
          <CycleAppliedFiltersList
            appliedFilters={currentProjectArchivedFilters ?? {}}
            handleClearAllFilters={() => clearAllFilters(projectId.toString(), "archived")}
            handleRemoveFilter={handleRemoveFilter}
          />
        </div>
      )}
      {totalArchivedCycles === 0 ? (
        <div className="h-full place-items-center">
          <EmptyState type={EmptyStateType.PROJECT_ARCHIVED_NO_CYCLES} />
        </div>
      ) : (
        <div className="relative h-full w-full overflow-auto">
          <ArchivedCyclesView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        </div>
      )}
    </>
  );
});
