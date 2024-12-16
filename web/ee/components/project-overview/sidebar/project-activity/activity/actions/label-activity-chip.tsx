import { FC } from "react";
import { observer } from "mobx-react";
import { ProjectLink } from ".";

type TProjectLabelActivityChip = { activity: any; showProject?: boolean };

export const ProjectLabelActivityChip: FC<TProjectLabelActivityChip> = observer((props) => {
  const { activity, showProject = true } = props;

  if (!activity) return <></>;
  return <span>{showProject && <ProjectLink activity={activity} />}</span>;
});
