import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { TCycleFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
// local imports
import { CycleAppliedFiltersList } from "../applied-filters";
import { ArchivedCyclesView } from "./view";

export const ArchivedCycleLayoutRoot = observer(function ArchivedCycleLayoutRoot() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
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
    return <CycleModuleListLayoutLoader />;
  }

  return (
    <>
      {calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0 && (
        <div className="border-b border-subtle px-5 py-3">
          <CycleAppliedFiltersList
            appliedFilters={currentProjectArchivedFilters ?? {}}
            handleClearAllFilters={() => clearAllFilters(projectId.toString(), "archived")}
            handleRemoveFilter={handleRemoveFilter}
          />
        </div>
      )}
      {totalArchivedCycles === 0 ? (
        <div className="h-full place-items-center">
          <EmptyStateDetailed
            assetKey="archived-cycle"
            title={t("workspace_empty_state.archive_cycles.title")}
            description={t("workspace_empty_state.archive_cycles.description")}
          />
        </div>
      ) : (
        <div className="relative h-full w-full overflow-auto">
          <ArchivedCyclesView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        </div>
      )}
    </>
  );
});
