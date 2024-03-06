import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useEventTracker, useProject } from "hooks/store";
// components
import { EmptyState } from "components/empty-state";
import { ProjectCard } from "components/project";
import { ProjectsLoader } from "components/ui";
// constants
import { EmptyStateType } from "constants/empty-state";

export const ProjectCardList = observer(() => {
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();

  const { workspaceProjectIds, searchedProjects, getProjectById } = useProject();

  if (!workspaceProjectIds) return <ProjectsLoader />;

  return (
    <>
      {workspaceProjectIds.length > 0 ? (
        <div className="h-full w-full overflow-y-auto p-8 vertical-scrollbar scrollbar-lg">
          {searchedProjects.length == 0 ? (
            <div className="mt-10 w-full text-center text-custom-text-400">No matching projects</div>
          ) : (
            <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
              {searchedProjects.map((projectId) => {
                const projectDetails = getProjectById(projectId);

                if (!projectDetails) return;

                return <ProjectCard key={projectDetails.id} project={projectDetails} />;
              })}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          type={EmptyStateType.WORKSPACE_PROJECTS}
          primaryButtonOnClick={() => {
            setTrackElement("Project empty state");
            commandPaletteStore.toggleCreateProjectModal(true);
          }}
        />
      )}
    </>
  );
});
