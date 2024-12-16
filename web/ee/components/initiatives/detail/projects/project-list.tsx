import { observer } from "mobx-react";
//
import { ProjectItem } from "./project-list-item";

type ProjectListProps = {
  workspaceSlug: string;
  projectIds: string[];
  initiativeId: string;
  disabled: boolean;
};

export const ProjectList = observer((props: ProjectListProps) => {
  const { workspaceSlug, projectIds, initiativeId, disabled } = props;

  return (
    <>
      {projectIds.map((projectId) => (
        <ProjectItem workspaceSlug={workspaceSlug} projectId={projectId} initiativeId={initiativeId} />
      ))}
    </>
  );
});
