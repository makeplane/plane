import { FC } from "react";
// types
import { ProjectBlock } from "./block";

interface Props {
  projectIds: string[] | undefined;
}

export const ProjectBlocksList: FC<Props> = (props) => {
  const { projectIds = [] } = props;

  return (
    <div className="relative h-full w-full">
      {projectIds &&
        projectIds?.length > 0 &&
        projectIds.map((projectId: string) => <ProjectBlock key={projectId} projectId={projectId} />)}
    </div>
  );
};
