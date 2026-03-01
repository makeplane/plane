/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { CustomMenu } from "@plane/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web constants
import { PROJECT_LAYOUTS } from "@/constants/project";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web types
import { EProjectLayouts, EProjectScope } from "@/types/workspace-project-filters";

type TProjectLayoutSelection = {
  workspaceSlug: string;
};

export const ProjectLayoutSelection = observer(function ProjectLayoutSelection(props: TProjectLayoutSelection) {
  const { workspaceSlug } = props;
  // hooks
  const { filters, updateLayout } = useProjectFilter();
  const { isMobile } = usePlatformOS();

  // derived values
  const selectedLayout = filters?.layout || EProjectLayouts.TABLE;

  const handleOnChange = (layoutKey: EProjectLayouts) => {
    if (selectedLayout !== layoutKey) {
      updateLayout(workspaceSlug, layoutKey);
    }
  };

  const visibleLayouts = PROJECT_LAYOUTS.filter(
    (layout) => !layout.selectivelyHide || filters?.scope === EProjectScope.MY_PROJECTS
  );

  const selectedLayoutData = PROJECT_LAYOUTS.find((l) => l.key === selectedLayout);
  const SelectedIcon = selectedLayoutData?.icon;

  return (
    <>
      <CustomMenu
        maxHeight={"md"}
        className="flex md:hidden flex-grow justify-center text-13 text-secondary"
        placement="bottom-start"
        customButton={
          <Button variant="secondary" className="relative px-2">
            {SelectedIcon && <SelectedIcon size={14} strokeWidth={2} className="h-3.5 w-3.5" />}
            <ChevronDownIcon className="size-3 text-secondary my-auto" strokeWidth={2} />
          </Button>
        }
        customButtonClassName="flex flex-grow justify-center text-secondary text-13"
        closeOnSelect
      >
        {visibleLayouts.map((layout, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={() => handleOnChange(layout.key)}
            className="flex items-center gap-2"
          >
            <layout.icon className="h-3 w-3" />
            <div className="text-tertiary">{layout.title}</div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
      <div className="hidden md:flex items-center gap-1 rounded-md bg-layer-3 p-1">
        {visibleLayouts.map((layout) => (
          <Tooltip key={layout.key} tooltipContent={layout.title} isMobile={isMobile}>
            <button
              type="button"
              className={cn(
                "group grid h-5.5 w-7 place-items-center overflow-hidden rounded-sm transition-all hover:bg-layer-transparent-hover",
                {
                  "bg-layer-transparent-active hover:bg-layer-transparent-active": selectedLayout === layout.key,
                }
              )}
              onClick={() => handleOnChange(layout.key)}
            >
              <layout.icon
                size={14}
                strokeWidth={2}
                className={cn("size-3.5", {
                  "text-primary": selectedLayout === layout.key,
                  "text-secondary": selectedLayout !== layout.key,
                })}
              />
            </button>
          </Tooltip>
        ))}
      </div>
    </>
  );
});
