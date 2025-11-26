import type { FC } from "react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { cn } from "@plane/utils";

type ProjectHeaderProps = {
  project: {
    name: string;
    logo_props: TLogoProps;
  };
};

export const ProjectHeader: FC<ProjectHeaderProps> = ({ project }) => (
  <div className={cn("flex-grow flex items-center gap-1.5 text-left select-none w-full flex-shrink-0")}>
    <div className="size-7 rounded-md bg-custom-background-90 flex items-center justify-center flex-shrink-0">
      <Logo logo={project.logo_props} size={16} />
    </div>
    <p className="truncate text-base font-medium text-custom-sidebar-text-200 flex-shrink-0">{project.name}</p>
  </div>
);
