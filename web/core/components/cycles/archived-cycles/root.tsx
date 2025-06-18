import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TCycleFilters } from "@plane/types";
// components
import { calculateTotalFilters } from "@plane/utils";
import { ArchivedCyclesView, CycleAppliedFiltersList } from "@/components/cycles";
import { DetailedEmptyState } from "@/components/empty-state";
import { CycleModuleListLayout } from "@/components/ui";
// helpers
// hooks
import { useCycle, useCycleFilter } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ArchivedCycleLayoutRoot: React.FC = observer(() => {
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
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/archived/empty-cycles" });

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
          <DetailedEmptyState
            title={t("project_cycles.empty_state.archived.title")}
            description={t("project_cycles.empty_state.archived.description")}
            assetPath={resolvedPath}
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
