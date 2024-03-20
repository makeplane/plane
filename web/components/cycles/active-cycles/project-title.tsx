import { FC } from "react";
// types
import { IProject } from "@plane/types";
// helpers
// import { renderEmoji } from "@/helpers/emoji.helper";

export type ActiveCyclesProjectTitleProps = {
  project: Partial<IProject> | undefined;
};

export const ActiveCyclesProjectTitle: FC<ActiveCyclesProjectTitleProps> = (props) => {
  const { project } = props;
  return (
    <div className="flex items-center gap-1.5">
      {/* {project?.emoji ? (
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
          {renderEmoji(project.emoji)}
        </span>
      ) : project?.icon_prop ? (
        <div className="grid h-7 w-7 flex-shrink-0 place-items-center">{renderEmoji(project.icon_prop)}</div>
      ) : (
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
          {project?.name.charAt(0)}
        </span>
      )} */}
      <h2 className="text-xl font-semibold">{project?.name}</h2>
    </div>
  );
};
