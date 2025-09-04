import { FC } from "react";
// types
import { IProject } from "@plane/types";
// ui
import { Logo } from "@/components/common/logo";

export type ActiveCyclesProjectTitleProps = {
  project: Partial<IProject> | undefined;
};

export const ActiveCyclesProjectTitle: FC<ActiveCyclesProjectTitleProps> = (props) => {
  const { project } = props;
  return (
    <div className="flex items-center gap-2 px-3">
      {project?.logo_props && <Logo logo={project.logo_props} />}
      <h2 className="text-xl font-semibold">{project?.name}</h2>
    </div>
  );
};
