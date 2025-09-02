import { FC } from "react";
// types
import { TeamspaceProjectBlock } from "./block";

interface Props {
  projectIds: string[] | undefined;
  teamspaceId: string;
}

export const TeamspaceProjectBlocksList: FC<Props> = (props) => {
  const { projectIds = [], teamspaceId } = props;

  return (
    <div className="relative h-full w-full">
      {projectIds &&
        projectIds?.length > 0 &&
        projectIds.map((projectId: string) => (
          <TeamspaceProjectBlock key={projectId} projectId={projectId} teamspaceId={teamspaceId} />
        ))}
    </div>
  );
};
