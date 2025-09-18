import { observer } from "mobx-react";
// assets
import { ContentWrapper } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
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
      <ContentWrapper>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
          {filteredProjectIds &&
            filteredProjectIds.map((projectId) => {
              const projectDetails = getProjectById(projectId);
              if (!projectDetails) return;
              return <ProjectCard key={projectDetails.id} project={projectDetails} />;
            })}
        </div>
      </ContentWrapper>
    </ProjectLayoutHOC>
  );
});
