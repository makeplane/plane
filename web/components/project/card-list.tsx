import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useEventTracker, useProject, useUser } from "hooks/store";
// components
import { ProjectCard } from "components/project";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
import { ProjectsLoader } from "components/ui";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
import { WORKSPACE_EMPTY_STATE_DETAILS } from "constants/empty-state";

export const ProjectCardList = observer(() => {
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
    currentUser,
  } = useUser();
  const { workspaceProjectIds, searchedProjects, getProjectById } = useProject();

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("onboarding", "projects", isLightMode);

  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  if (!workspaceProjectIds) return <ProjectsLoader />;

  return (
    <>
      {workspaceProjectIds.length > 0 ? (
        <div className="h-full w-full overflow-y-auto p-8">
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
          image={emptyStateImage}
          title={WORKSPACE_EMPTY_STATE_DETAILS["projects"].title}
          description={WORKSPACE_EMPTY_STATE_DETAILS["projects"].description}
          primaryButton={{
            text: WORKSPACE_EMPTY_STATE_DETAILS["projects"].primaryButton.text,
            onClick: () => {
              setTrackElement("Project empty state");
              commandPaletteStore.toggleCreateProjectModal(true);
            },
          }}
          comicBox={{
            title: WORKSPACE_EMPTY_STATE_DETAILS["projects"].comicBox.title,
            description: WORKSPACE_EMPTY_STATE_DETAILS["projects"].comicBox.description,
          }}
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
    </>
  );
});
