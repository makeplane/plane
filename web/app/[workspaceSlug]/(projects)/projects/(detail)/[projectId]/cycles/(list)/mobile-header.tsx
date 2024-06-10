"use client";

import { observer } from "mobx-react";
// ui
import { List } from "lucide-react";
import { CustomMenu } from "@plane/ui";
// icon
// constants
import { CYCLE_VIEW_LAYOUTS } from "@/constants/cycle";
// hooks
import { useCycleFilter, useProject } from "@/hooks/store";

export const CyclesListMobileHeader = observer(() => {
  const { currentProjectDetails } = useProject();
  // hooks
  const { updateDisplayFilters } = useCycleFilter();
  return (
    <div className="flex justify-center sm:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-center text-custom-text-200 text-sm py-2 border-b border-custom-border-200 bg-custom-sidebar-background-100"
        // placement="bottom-start"
        customButton={
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="flex flex-grow justify-center text-custom-text-200 text-sm">Layout</span>
          </span>
        }
        customButtonClassName="flex flex-grow justify-center items-center text-custom-text-200 text-sm"
        closeOnSelect
      >
        {CYCLE_VIEW_LAYOUTS.map((layout) => {
          if (layout.key == "gantt") return;
          return (
            <CustomMenu.MenuItem
              key={layout.key}
              onClick={() => {
                updateDisplayFilters(currentProjectDetails!.id, {
                  layout: layout.key,
                });
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
