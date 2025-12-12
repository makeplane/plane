import { observer } from "mobx-react";
import { ProjectIcon } from "@plane/propel/icons";
// components
import { ProjectLogo } from "@/components/common/project-logo";
// store
import type { PublishStore } from "@/store/publish/publish.store";
// local imports
import { NavbarControls } from "./controls";

type Props = {
  publishSettings: PublishStore;
};

export const IssuesNavbarRoot = observer(function IssuesNavbarRoot(props: Props) {
  const { publishSettings } = props;
  // hooks
  const { project_details } = publishSettings;

  return (
    <div className="relative flex justify-between w-full gap-4 px-5">
      {/* project detail */}
      <div className="flex shrink-0 items-center gap-2">
        {project_details ? (
          <span className="size-7 shrink-0 grid place-items-center">
            <ProjectLogo logo={project_details.logo_props} className="text-16" />
          </span>
        ) : (
          <span className="grid size-7 shrink-0 place-items-center rounded-sm uppercase">
            <ProjectIcon className="size-4" />
          </span>
        )}
        <div className="line-clamp-1 max-w-[300px] overflow-hidden text-16 font-medium">
          {project_details?.name || `...`}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <NavbarControls publishSettings={publishSettings} />
      </div>
    </div>
  );
});
