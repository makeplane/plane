import { ReactElement, useCallback } from "react";
import { observer } from "mobx-react";
import { TProjectFilters } from "@plane/types";
// components
import { PageHead } from "@/components/core";
import { ProjectsHeader } from "@/components/headers";
import { ProjectAppliedFiltersList, ProjectCardList } from "@/components/project";
// layouts
import { calculateTotalFilters } from "@/helpers/filter.helper";
import { useApplication, useProject, useProjectFilter, useWorkspace } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
// helpers
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectsPage: NextPageWithLayout = observer(() => {
  // store
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { currentWorkspace } = useWorkspace();
  const { workspaceProjectIds, filteredProjectIds } = useProject();
  const { currentWorkspaceFilters, clearAllFilters, updateFilters } = useProjectFilter();
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

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full flex flex-col">
        {calculateTotalFilters(currentWorkspaceFilters ?? {}) !== 0 && (
          <div className="border-b border-custom-border-200 px-5 py-3">
            <ProjectAppliedFiltersList
              appliedFilters={currentWorkspaceFilters ?? {}}
              handleClearAllFilters={() => clearAllFilters(`${workspaceSlug}`)}
              handleRemoveFilter={handleRemoveFilter}
              filteredProjects={filteredProjectIds?.length ?? 0}
              totalProjects={workspaceProjectIds?.length ?? 0}
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
  return <AppLayout header={<ProjectsHeader />}>{page}</AppLayout>;
};

export default ProjectsPage;
