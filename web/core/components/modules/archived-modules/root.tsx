import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TModuleFilters } from "@plane/types";
// components
import { calculateTotalFilters } from "@plane/utils";
import { DetailedEmptyState } from "@/components/empty-state";
import { ArchivedModulesView, ModuleAppliedFiltersList } from "@/components/modules";
import { CycleModuleListLayout } from "@/components/ui";
// helpers
// hooks
import { useModule, useModuleFilter } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ArchivedModuleLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { fetchArchivedModules, projectArchivedModuleIds, loader } = useModule();
  const { clearAllFilters, currentProjectArchivedFilters, updateFilters } = useModuleFilter();
  // derived values
  const totalArchivedModules = projectArchivedModuleIds?.length ?? 0;
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/archived/empty-modules" });

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
          <DetailedEmptyState
            title={t("project_module.empty_state.archived.title")}
            description={t("project_module.empty_state.archived.description")}
            assetPath={resolvedPath}
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
