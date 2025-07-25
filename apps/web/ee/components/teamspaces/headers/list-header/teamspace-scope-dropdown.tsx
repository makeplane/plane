"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { CustomMenu, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web constants
import { TEAMSPACE_SCOPE_MAP } from "@/plane-web/constants/teamspace";
// plane web hooks
import { useTeamspaceFilter, useTeamspaces } from "@/plane-web/hooks/store";

export const TeamspaceScopeDropdown: FC = observer(() => {
  // hooks
  const { loader, currentScopeTeamSpaceIds, getScopeTeamSpaceIds } = useTeamspaces();
  const { scope, updateScope } = useTeamspaceFilter();
  // derived values
  const selectedScopeCount = currentScopeTeamSpaceIds ? currentScopeTeamSpaceIds.length : null;
  const selectedScope = TEAMSPACE_SCOPE_MAP[scope] ?? undefined;

  const DropdownLabel = () => (
    <>
      <div className="hidden md:flex relative items-center gap-2">
        <div className="flex gap-2 flex-1 my-auto">
          <div className="whitespace-nowrap font-medium my-auto">{selectedScope.label}</div>
          <div className="px-1.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
            {selectedScopeCount}
          </div>
        </div>
        <ChevronDown className="h-3 w-3" strokeWidth={2} />
      </div>
      <div className="flex md:hidden text-sm items-center gap-2 neutral-primary text-custom-text-200 justify-center w-full">
        <span>{selectedScope?.label}</span>
        <ChevronDown className="h-3 w-3 hidden md:flex" strokeWidth={2} />
      </div>
    </>
  );

  const DropdownOptions = () =>
    (Object.values(TEAMSPACE_SCOPE_MAP) || []).map((scope) => (
      <CustomMenu.MenuItem
        key={scope.key}
        className="flex items-center gap-2 truncate"
        onClick={() => updateScope(scope.key)}
      >
        <div className="truncate font-medium text-xs">{scope?.label}</div>
        <div className="px-1.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
          {getScopeTeamSpaceIds(scope.key)?.length}
        </div>
      </CustomMenu.MenuItem>
    ));

  return selectedScope && loader !== "init-loader" ? (
    <CustomMenu
      maxHeight={"md"}
      className={cn(
        "flex flex-grow justify-center text-xs text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded px-3 py-1.5"
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
