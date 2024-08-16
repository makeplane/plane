import { FC } from "react";
// types
import { IProject } from "@plane/types";
// helpers
import { Logo } from "@/components/common";

export type ActiveCyclesProjectTitleProps = {
  project: Partial<IProject> | undefined;
};

export const ActiveCyclesProjectTitle: FC<ActiveCyclesProjectTitleProps> = (props) => {
  const { project } = props;
  return (
    <div className="flex items-center gap-1.5">
      {project?.logo_props ? (
        <Logo logo={project.logo_props} size={22} />
      ) : (
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
          {project?.name?.charAt(0)}
        </span>
      )}
      {/* <Logo */}
      <h2 className="text-xl font-semibold">{project?.name}</h2>
    </div>
  );
};
