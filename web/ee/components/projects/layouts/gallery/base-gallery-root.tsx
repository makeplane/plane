import { observer } from "mobx-react";
// assets
import { useProject } from "@/hooks/store";
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import { TProject } from "@/plane-web/types/projects";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { ProjectCard } from "./card";

export const BaseProjectRoot = observer(() => {
  // store hooks
  const { getProjectById } = useProject();
  const { getFilteredProjectsByLayout } = useProjectFilter();

  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.GALLERY);

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.GALLERY}>
      <div className="vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
          {filteredProjectIds &&
            filteredProjectIds.map((projectId) => {
              const projectDetails = getProjectById(projectId);
              if (!projectDetails) return;
              return <ProjectCard key={projectDetails.id} project={projectDetails as TProject} />;
            })}
        </div>
      </div>
    </ProjectLayoutHOC>
  );
});
