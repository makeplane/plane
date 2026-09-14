/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { observer } from "mobx-react";
// ui
import type { ISvgIcons } from "@plane/propel/icons";
import { GridOutline, ListOutline, TimelineOutline } from "@makeplane/propel/icons";
// plane package imports
import type { TCycleLayoutOptions } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// hooks
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
import { useProject } from "@/hooks/store/use-project";

const CYCLE_VIEW_LAYOUTS: {
  key: TCycleLayoutOptions;
  icon: React.FC<ISvgIcons>;
  title: string;
}[] = [
  {
    key: "list",
    icon: ListOutline,
    title: "List layout",
  },
  {
    key: "board",
    icon: GridOutline,
    title: "Gallery layout",
  },
  {
    key: "gantt",
    icon: TimelineOutline,
    title: "Timeline layout",
  },
];

export const CyclesListMobileHeader = observer(function CyclesListMobileHeader() {
  const { currentProjectDetails } = useProject();
  // hooks
  const { updateDisplayFilters } = useCycleFilter();
  return (
    <div className="flex justify-center sm:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-center border-b border-subtle bg-surface-1 py-2 text-13 text-secondary"
        // placement="bottom-start"
        customButton={
          <span className="flex items-center gap-2">
            <ListOutline className="h-4 w-4" />
            <span className="flex flex-grow justify-center text-13 text-secondary">Layout</span>
          </span>
        }
        customButtonClassName="flex flex-grow justify-center items-center text-secondary text-13"
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
              <layout.icon className="h-3 w-3" />
              <div className="text-tertiary">{layout.title}</div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </div>
  );
});
