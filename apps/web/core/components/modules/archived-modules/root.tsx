import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { TModuleFilters } from "@plane/types";
// components
import { calculateTotalFilters } from "@plane/utils";
import { ArchivedModulesView, ModuleAppliedFiltersList } from "@/components/modules";
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
// helpers
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useModuleFilter } from "@/hooks/store/use-module-filter";

export const ArchivedModuleLayoutRoot = observer(function ArchivedModuleLayoutRoot() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { fetchArchivedModules, projectArchivedModuleIds, loader } = useModule();
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
    return <CycleModuleListLayoutLoader />;
  }

  return (
    <>
      {calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0 && (
        <div className="border-b border-subtle px-5 py-3">
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
          <EmptyStateDetailed
            assetKey="archived-module"
            title={t("workspace_empty_state.archive_modules.title")}
            description={t("workspace_empty_state.archive_modules.description")}
          />
        </div>
      ) : (
        <div className="relative h-full w-full overflow-auto">
          <ArchivedModulesView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        </div>
      )}
    </>
  );
});
