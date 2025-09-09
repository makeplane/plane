"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web constants
import { PROJECT_LAYOUTS } from "@/plane-web/constants/project";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web types
import { EProjectLayouts, EProjectScope } from "@/plane-web/types/workspace-project-filters";

type TProjectLayoutSelection = {
  workspaceSlug: string;
};

export const ProjectLayoutSelection: FC<TProjectLayoutSelection> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { filters, updateLayout } = useProjectFilter();
  const { isMobile } = usePlatformOS();

  // derived values
  const selectedLayout = filters?.layout || EProjectLayouts.TABLE;

  return (
    <>
      <CustomMenu
        maxHeight={"md"}
        className="flex md:hidden flex-grow justify-center text-sm text-custom-text-200"
        placement="bottom-start"
        customButton={<span className="flex flex-grow justify-center text-sm text-custom-text-200 m-auto">Layout</span>}
        customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
        closeOnSelect
      >
        {PROJECT_LAYOUTS.map((layout, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={() => updateLayout(workspaceSlug.toString(), layout.key)}
            className="flex items-center gap-2"
          >
            <layout.icon className="h-3 w-3" />
            <div className="text-custom-text-300">{layout.title}</div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
      <div className="hidden md:flex items-center gap-1 rounded bg-custom-background-80 p-1">
        {PROJECT_LAYOUTS.filter(
          (layout) => !layout.selectivelyHide || filters?.scope === EProjectScope.MY_PROJECTS
        ).map((layout) => (
          <Tooltip key={layout.key} tooltipContent={layout.title} isMobile={isMobile}>
            <button
              type="button"
              className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
                selectedLayout == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
              }`}
              onClick={() => updateLayout(workspaceSlug, layout.key)}
            >
              <layout.icon
                size={14}
                strokeWidth={2}
                className={`h-3.5 w-3.5 ${selectedLayout == layout.key ? "text-custom-text-100" : "text-custom-text-200"}`}
              />
            </button>
          </Tooltip>
        ))}
      </div>
    </>
  );
});
