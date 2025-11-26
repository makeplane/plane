import type { FC } from "react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";

type ProjectHeaderProps = {
  project: {
    name: string;
    logo_props: TLogoProps;
  };
};

export const ProjectHeader: FC<ProjectHeaderProps> = ({ project }) => (
  <div className="flex items-center gap-1.5 text-left select-none w-full">
    <div className="size-7 rounded-md bg-custom-background-90 flex items-center justify-center flex-shrink-0">
      <Logo logo={project.logo_props} size={16} />
    </div>
    <p className="truncate text-base font-medium text-custom-sidebar-text-200 flex-shrink-0">{project.name}</p>
  </div>
);
