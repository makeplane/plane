import { observer } from "mobx-react";
// local components
import { ProjectItem } from "./project-list-item";

type ProjectListProps = {
  workspaceSlug: string;
  projectIds: string[];
  initiativeId: string;
  disabled: boolean;
};

export const ProjectList = observer((props: ProjectListProps) => {
  const { workspaceSlug, projectIds, initiativeId } = props;

  return (
    <>
      {projectIds.map((projectId) => (
        <ProjectItem key={projectId} workspaceSlug={workspaceSlug} projectId={projectId} initiativeId={initiativeId} />
      ))}
    </>
  );
});
