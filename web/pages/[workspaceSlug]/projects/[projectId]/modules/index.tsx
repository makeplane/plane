import { ReactElement, useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { TModuleFilters } from "@plane/types";
// layouts
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { ModulesListHeader } from "@/components/headers";
import { ModuleViewHeader, ModuleAppliedFiltersList, ModulesListView } from "@/components/modules";
// types
// hooks
import ModulesListMobileHeader from "@/components/modules/moduels-list-mobile-header";
import { EmptyStateType } from "@/constants/empty-state";
import { calculateTotalFilters } from "@/helpers/filter.helper";
import { useModuleFilter, useProject } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { NextPageWithLayout } from "@/lib/types";

const ProjectModulesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { getProjectById, currentProjectDetails } = useProject();
  const { currentProjectFilters, currentProjectDisplayFilters, clearAllFilters, updateFilters, updateDisplayFilters } =
    useModuleFilter();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Modules` : undefined;

  const handleRemoveFilter = useCallback(
    (key: keyof TModuleFilters, value: string | null) => {
      if (!projectId) return;
      let newValues = currentProjectFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(projectId.toString(), { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  if (!workspaceSlug || !projectId) return <></>;

  // No access to
  if (currentProjectDetails?.module_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          type={EmptyStateType.DISABLED_PROJECT_MODULE}
          primaryButtonLink={`/${workspaceSlug}/projects/${projectId}/settings/features`}
        />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full flex flex-col">
        <div className="h-[50px] flex-shrink-0 w-full border-b border-custom-border-200 px-6 relative flex items-center gap-4 justify-between">
          <div className="flex items-center">
            <span className="block text-sm font-medium">Module name</span>
          </div>
          <ModuleViewHeader />
        </div>
        {(calculateTotalFilters(currentProjectFilters ?? {}) !== 0 || currentProjectDisplayFilters?.favorites) && (
          <div className="border-b border-custom-border-200 px-5 py-3">
            <ModuleAppliedFiltersList
              appliedFilters={currentProjectFilters ?? {}}
              isFavoriteFilterApplied={currentProjectDisplayFilters?.favorites ?? false}
              handleClearAllFilters={() => clearAllFilters(`${projectId}`)}
              handleRemoveFilter={handleRemoveFilter}
              handleDisplayFiltersUpdate={(val) => {
                if (!projectId) return;
                updateDisplayFilters(projectId.toString(), val);
              }}
              alwaysAllowEditing
            />
          </div>
        )}
        <ModulesListView />
      </div>
    </>
  );
});

ProjectModulesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectModulesPage;
