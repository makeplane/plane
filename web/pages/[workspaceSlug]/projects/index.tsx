import { ReactElement, useCallback } from "react";
import { observer } from "mobx-react";
import { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
// components
import { PageHead } from "@/components/core";
import { ProjectsHeader } from "@/components/headers";
import { ProjectAppliedFiltersList, ProjectCardList } from "@/components/project";
// layouts
import ProjectsMobileHeader from "@/components/project/projects-mobile-header";
import { calculateTotalFilters } from "@/helpers/filter.helper";
import { useAppRouter, useProject, useProjectFilter, useWorkspace } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
// helpers
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectsPage: NextPageWithLayout = observer(() => {
  // store
  const { workspaceSlug } = useAppRouter();
  const { currentWorkspace } = useWorkspace();
  const { totalProjectIds, filteredProjectIds } = useProject();
  const {
    currentWorkspaceFilters,
    currentWorkspaceAppliedDisplayFilters,
    clearAllFilters,
    clearAllAppliedDisplayFilters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Projects` : undefined;

  const handleRemoveFilter = useCallback(
    (key: keyof TProjectFilters, value: string | null) => {
      if (!workspaceSlug) return;
      let newValues = currentWorkspaceFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(workspaceSlug.toString(), { [key]: newValues });
    },
    [currentWorkspaceFilters, updateFilters, workspaceSlug]
  );

  const handleRemoveDisplayFilter = useCallback(
    (key: TProjectAppliedDisplayFilterKeys) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug.toString(), { [key]: false });
    },
    [updateDisplayFilters, workspaceSlug]
  );

  const handleClearAllFilters = useCallback(() => {
    if (!workspaceSlug) return;
    clearAllFilters(workspaceSlug.toString());
    clearAllAppliedDisplayFilters(workspaceSlug.toString());
  }, [clearAllFilters, clearAllAppliedDisplayFilters, workspaceSlug]);

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        {(calculateTotalFilters(currentWorkspaceFilters ?? {}) !== 0 ||
          currentWorkspaceAppliedDisplayFilters?.length !== 0) && (
          <div className="border-b border-custom-border-200 px-5 py-3">
            <ProjectAppliedFiltersList
              appliedFilters={currentWorkspaceFilters ?? {}}
              appliedDisplayFilters={currentWorkspaceAppliedDisplayFilters ?? []}
              handleClearAllFilters={handleClearAllFilters}
              handleRemoveFilter={handleRemoveFilter}
              handleRemoveDisplayFilter={handleRemoveDisplayFilter}
              filteredProjects={filteredProjectIds?.length ?? 0}
              totalProjects={totalProjectIds?.length ?? 0}
              alwaysAllowEditing
            />
          </div>
        )}
        <ProjectCardList />
      </div>
    </>
  );
});

ProjectsPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<ProjectsHeader />} mobileHeader={<ProjectsMobileHeader/>}>{page}</AppLayout>;
};

export default ProjectsPage;
