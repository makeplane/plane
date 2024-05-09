import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// types
import { TModuleFilters } from "@plane/types";
// components
import { EmptyState } from "@/components/empty-state";
import { ArchivedModulesView, ModuleAppliedFiltersList } from "@/components/modules";
import { CycleModuleListLayout } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useModule, useModuleFilter } from "@/hooks/store";

export const ArchivedModuleLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const { fetchArchivedModules, projectArchivedModuleIds, loader } = useModule();
  // module filters hook
  const { clearAllFilters, currentProjectArchivedFilters, updateFilters } = useModuleFilter();
  // derived values
  const totalArchivedModules = projectArchivedModuleIds?.length ?? 0;

  useSWR(
    workspaceSlug && projectId ? `ARCHIVED_MODULES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await fetchArchivedModules(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleRemoveFilter = useCallback(
    (key: keyof TModuleFilters, value: string | null) => {
      if (!projectId) return;
      let newValues = currentProjectArchivedFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(projectId.toString(), { [key]: newValues }, "archived");
    },
    [currentProjectArchivedFilters, projectId, updateFilters]
  );

  if (!workspaceSlug || !projectId) return <></>;

  if (loader || !projectArchivedModuleIds) {
    return <CycleModuleListLayout />;
  }

  return (
    <>
      {calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0 && (
        <div className="border-b border-custom-border-200 px-5 py-3">
          <ModuleAppliedFiltersList
            appliedFilters={currentProjectArchivedFilters ?? {}}
            handleClearAllFilters={() => clearAllFilters(projectId.toString(), "archived")}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
            isArchived
          />
        </div>
      )}
      {totalArchivedModules === 0 ? (
        <div className="h-full place-items-center">
          <EmptyState type={EmptyStateType.PROJECT_ARCHIVED_NO_MODULES} />
        </div>
      ) : (
        <div className="relative h-full w-full overflow-auto">
          <ArchivedModulesView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        </div>
      )}
    </>
  );
});
