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

import type { FC } from "react";
import { observer } from "mobx-react";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomMenu, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web constants
import { TEAMSPACE_SCOPE_MAP } from "@/constants/teamspace";
// plane web hooks
import { useTeamspaceFilter, useTeamspaces } from "@/plane-web/hooks/store";

export const TeamspaceScopeDropdown = observer(function TeamspaceScopeDropdown() {
  // hooks
  const { loader, currentScopeTeamSpaceIds, getScopeTeamSpaceIds } = useTeamspaces();
  const { scope, updateScope } = useTeamspaceFilter();
  // derived values
  const selectedScopeCount = currentScopeTeamSpaceIds ? currentScopeTeamSpaceIds.length : null;
  const selectedScope = TEAMSPACE_SCOPE_MAP[scope] ?? undefined;

  function DropdownLabel() {
    return (
      <>
        <div className="hidden md:flex relative items-center gap-2">
          <div className="flex gap-2 flex-1 my-auto">
            <div className="whitespace-nowrap font-medium my-auto">{selectedScope.label}</div>
            <div className="px-1.5 flex-shrink-0 bg-accent-subtle text-accent-primary text-caption-sm-semibold rounded-xl">
              {selectedScopeCount}
            </div>
          </div>
          <ChevronDownIcon className="h-3 w-3" strokeWidth={2} />
        </div>
        <div className="flex md:hidden text-body-xs-regular items-center gap-2 text-secondary justify-center w-full">
          <span>{selectedScope?.label}</span>
          <ChevronDownIcon className="h-3 w-3 hidden md:flex" strokeWidth={2} />
        </div>
      </>
    );
  }

  function DropdownOptions() {
    return (Object.values(TEAMSPACE_SCOPE_MAP) || []).map((scope) => (
      <CustomMenu.MenuItem
        key={scope.key}
        className="flex items-center gap-2 truncate"
        onClick={() => updateScope(scope.key)}
      >
        <div className="truncate font-medium text-caption-sm-medium">{scope?.label}</div>
        <div className="px-1.5 flex-shrink-0 bg-accent-subtle text-accent-primary text-caption-sm-semibold rounded-xl">
          {getScopeTeamSpaceIds(scope.key)?.length}
        </div>
      </CustomMenu.MenuItem>
    ));
  }

  return selectedScope && loader !== "init-loader" ? (
    <CustomMenu
      maxHeight={"md"}
      className={cn(
        "flex flex-grow justify-center text-caption-sm-medium text-secondary border-[0.5px] border-subtle-1 hover:bg-layer-1-hover rounded-sm px-3 py-1.5"
      )}
      placement="bottom-start"
      customButton={<DropdownLabel />}
      customButtonClassName="flex flex-grow justify-center"
      optionsClassName="mt-2.5"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  ) : (
    <Loader>
      <Loader.Item width="120px" height="26px" />
    </Loader>
  );
});
