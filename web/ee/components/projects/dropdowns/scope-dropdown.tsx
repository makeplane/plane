"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { CustomMenu, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web constants
import { PROJECT_SCOPES } from "@/plane-web/constants/project";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web types
import { EProjectLayouts, EProjectScope } from "@/plane-web/types/workspace-project-filters";

export type TProjectScopeDropdown = {
  workspaceSlug: string;
  className?: string;
};

export const ProjectScopeDropdown: FC<TProjectScopeDropdown> = observer((props) => {
  const { workspaceSlug, className } = props;
  // hooks
  const { scopeProjectsCount, filters, updateScope, updateLayout } = useProjectFilter();
  const router = useRouter();

  // derived values
  const selectedScope = filters?.scope;
  const selectedScopeCount = selectedScope && scopeProjectsCount?.[selectedScope];

  const DropdownLabel = () => (
    <>
      <div className="hidden md:flex relative items-center gap-2 w-[150px]">
        <div className="flex gap-2 flex-1 my-auto">
          <div className="whitespace-nowrap font-medium my-auto">
            {(PROJECT_SCOPES || []).find((scope) => selectedScope === scope.key)?.label}
          </div>
          <div className="px-2 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
            {selectedScopeCount}
          </div>
        </div>
        <ChevronDown className="h-3 w-3" strokeWidth={2} />
      </div>
      <div className="flex md:hidden text-sm items-center gap-2 neutral-primary text-custom-text-200 justify-center w-full">
        <span>{(PROJECT_SCOPES || []).find((scope) => selectedScope === scope.key)?.label}</span>
        <ChevronDown className="h-3 w-3 hidden md:flex" strokeWidth={2} />
      </div>
    </>
  );
  const DropdownOptions = () =>
    (PROJECT_SCOPES || []).map((scope) => (
      <CustomMenu.MenuItem
        key={scope.key}
        className="flex items-center gap-2 truncate"
        onClick={() => {
          router.push(`?show-all-projects=${scope.key === EProjectScope.ALL_PROJECTS}`);
          updateScope(workspaceSlug, scope.key);
          if (
            scope.key === EProjectScope.ALL_PROJECTS &&
            filters?.layout &&
            ![EProjectLayouts.GALLERY, EProjectLayouts.TABLE].includes(filters?.layout)
          )
            updateLayout(workspaceSlug, EProjectLayouts.GALLERY);
        }}
      >
        <div className="truncate font-medium text-xs">{scope?.label}</div>
        <div className="px-2 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
          {scopeProjectsCount?.[scope.key]}
        </div>
      </CustomMenu.MenuItem>
    ));

  return selectedScope ? (
    <CustomMenu
      maxHeight={"md"}
      className={cn(
        "flex flex-grow justify-center text-xs text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded px-3 py-1.5",
        className
      )}
      placement="bottom-start"
      customButton={<DropdownLabel />}
      customButtonClassName="flex flex-grow justify-center"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  ) : (
    <Loader>
      <Loader.Item width="150px" height="32px" />
    </Loader>
  );
});
