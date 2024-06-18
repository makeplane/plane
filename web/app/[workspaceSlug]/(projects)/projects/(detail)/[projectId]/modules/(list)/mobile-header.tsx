"use client";

import { observer } from "mobx-react";
import { CustomMenu } from "@plane/ui";
import { MODULE_VIEW_LAYOUTS } from "@/constants/module";
import { useModuleFilter, useProject } from "@/hooks/store";

export const ModulesListMobileHeader = observer(() => {
  const { currentProjectDetails } = useProject();
  const { updateDisplayFilters } = useModuleFilter();

  return (
    <div className="flex justify-center md:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-center text-custom-text-200 text-sm py-2 border-b border-custom-border-200 bg-custom-sidebar-background-100"
        // placement="bottom-start"
        customButton={<span className="flex flex-grow justify-center text-custom-text-200 text-sm">Layout</span>}
        customButtonClassName="flex flex-grow justify-center items-center text-custom-text-200 text-sm"
        closeOnSelect
      >
        {MODULE_VIEW_LAYOUTS.map((layout) => {
          if (layout.key == "gantt") return;
          return (
            <CustomMenu.MenuItem
              key={layout.key}
              onClick={() => {
                updateDisplayFilters(currentProjectDetails!.id.toString(), { layout: layout.key });
              }}
              className="flex items-center gap-2"
            >
              <layout.icon className="w-3 h-3" />
              <div className="text-custom-text-300">{layout.title}</div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </div>
  );
});
