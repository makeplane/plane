"use client";
import { FC } from "react";
import { observer } from "mobx-react-lite";
import { Briefcase } from "lucide-react";
// components
import { ProjectLogo } from "@/components/common";
import { NavbarControls } from "@/components/issues/navbar/controls";
// hooks
import { useProject } from "@/hooks/store";

type IssueNavbarProps = {
  workspaceSlug: string;
  projectId: string;
};

const IssueNavbar: FC<IssueNavbarProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { project } = useProject();

  return (
    <div className="relative flex justify-between w-full gap-4 px-5">
      {/* project detail */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {project ? (
          <span className="h-7 w-7 flex-shrink-0 grid place-items-center">
            <ProjectLogo logo={project.logo_props} className="text-lg" />
          </span>
        ) : (
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
            <Briefcase className="h-4 w-4" />
          </span>
        )}
        <div className="line-clamp-1 max-w-[300px] overflow-hidden text-lg font-medium">{project?.name || `...`}</div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <NavbarControls workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </div>
  );
});

export default IssueNavbar;
