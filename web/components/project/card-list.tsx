import { observer } from "mobx-react-lite";
import Image from "next/image";
// hooks
// components
import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project";
import { ProjectsLoader } from "@/components/ui";
// assets
import { EmptyStateType } from "@/constants/empty-state";
import { useApplication, useEventTracker, useProject, useProjectFilter } from "@/hooks/store";
import AllFiltersImage from "public/empty-state/project/all-filters.svg";
import NameFilterImage from "public/empty-state/project/name-filter.svg";
// constants

export const ProjectCardList = observer(() => {
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();
  const { workspaceProjectIds, filteredProjectIds, getProjectById } = useProject();
  const { searchQuery, currentWorkspaceDisplayFilters } = useProjectFilter();

  if (workspaceProjectIds?.length === 0 && !currentWorkspaceDisplayFilters?.archived_projects)
    return (
      <EmptyState
        type={EmptyStateType.WORKSPACE_PROJECTS}
        primaryButtonOnClick={() => {
          setTrackElement("Project empty state");
          commandPaletteStore.toggleCreateProjectModal(true);
        }}
      />
    );

  if (!filteredProjectIds) return <ProjectsLoader />;

  if (filteredProjectIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching projects"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching projects</h5>
          <p className="text-custom-text-400 text-base whitespace-pre-line">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all projects"
              : "No projects detected with the matching\ncriteria. Create a new project instead"}
          </p>
        </div>
      </div>
    );

  return (
    <div className="h-full w-full overflow-y-auto p-8 vertical-scrollbar scrollbar-lg">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjectIds.map((projectId) => {
          const projectDetails = getProjectById(projectId);
          if (!projectDetails) return;
          return <ProjectCard key={projectDetails.id} project={projectDetails} />;
        })}
      </div>
    </div>
  );
});
