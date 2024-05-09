import { FC } from "react";
// types
import { IProject } from "@plane/types";
// ui
import { ProjectLogo } from "../project";

export type ActiveCyclesProjectTitleProps = {
  project: Partial<IProject> | undefined;
};

export const ActiveCyclesProjectTitle: FC<ActiveCyclesProjectTitleProps> = (props) => {
  const { project } = props;
  return (
    <div className="flex items-center gap-1.5">
      {project?.logo_props && <ProjectLogo logo={project.logo_props} />}
      <h2 className="text-xl font-semibold">{project?.name}</h2>
    </div>
  );
};
