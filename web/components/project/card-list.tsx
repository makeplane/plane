import { FC } from "react";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectCard } from "components/project";
import { Loader } from "@plane/ui";
// images
import emptyProject from "public/empty-state/empty_project.webp";
// icons
import { NewEmptyState } from "components/common/new-empty-state";

export interface IProjectCardList {
  workspaceSlug: string;
}

export const ProjectCardList: FC<IProjectCardList> = observer((props) => {
  const { workspaceSlug } = props;
  // store
  const {
    project: projectStore,
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
  } = useMobxStore();

  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : null;

  if (!projects) {
    return (
      <Loader className="grid grid-cols-3 gap-4">
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
      </Loader>
    );
  }

  return (
    <>
      {projects.length > 0 ? (
        <div className="h-full w-full p-8 overflow-y-auto">
          {projectStore.searchedProjects.length == 0 ? (
            <div className="w-full text-center text-custom-text-400 mt-10">No matching projects</div>
          ) : (
            <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
              {projectStore.searchedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <NewEmptyState
          image={emptyProject}
          title="Start a Project"
          description="Think of each project as the parent for goal-oriented work. Projects are where Jobs, Cycles, and Modules live and, along with your colleagues, help you achieve that goal."
          comicBox={{
            title: "Everything starts with a project in Plane",
            direction: "right",
            description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
          }}
          primaryButton={{
            text: "Start your first project",
            onClick: () => {
              setTrackElement("PROJECTS_EMPTY_STATE");
              commandPaletteStore.toggleCreateProjectModal(true);
            },
          }}
        />
      )}
    </>
  );
});
