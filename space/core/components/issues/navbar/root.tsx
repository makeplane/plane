"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { Briefcase } from "lucide-react";
// components
import { ProjectLogo } from "@/components/common";
import { NavbarControls } from "@/components/issues";
// store
import { PublishStore } from "@/store/publish/publish.store";

type Props = {
  publishSettings: PublishStore;
};

export const IssuesNavbarRoot: FC<Props> = observer((props) => {
  const { publishSettings } = props;
  // hooks
  const { project_details } = publishSettings;

  return (
    <div className="relative flex justify-between w-full gap-4 px-5">
      {/* project detail */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {project_details ? (
          <span className="h-7 w-7 flex-shrink-0 grid place-items-center">
            <ProjectLogo logo={project_details.logo_props} className="text-lg" />
          </span>
        ) : (
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
            <Briefcase className="h-4 w-4" />
          </span>
        )}
        <div className="line-clamp-1 max-w-[300px] overflow-hidden text-lg font-medium">
          {project_details?.name || `...`}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <NavbarControls publishSettings={publishSettings} />
      </div>
    </div>
  );
});
