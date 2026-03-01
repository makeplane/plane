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
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomMenu, getButtonStyling, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web constants
import { PROJECT_SCOPES } from "@/constants/project";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web types
import { EProjectLayouts, EProjectScope } from "@/types/workspace-project-filters";
import { Button } from "@plane/propel/button";

export type TProjectScopeDropdown = {
  workspaceSlug: string;
  className?: string;
};

export const ProjectScopeDropdown = observer(function ProjectScopeDropdown(props: TProjectScopeDropdown) {
  const { workspaceSlug, className } = props;
  // hooks
  const { scopeProjectsCount, filters, updateScope, updateLayout } = useProjectFilter();
  const router = useRouter();

  // derived values
  const selectedScope = filters?.scope;
  const selectedScopeCount = selectedScope && scopeProjectsCount?.[selectedScope];

  function DropdownLabel() {
    return (
      <>
        <div className="hidden md:flex relative items-center gap-2">
          <div className="flex gap-2 flex-1 my-auto">
            <div className="whitespace-nowrap font-medium my-auto">
              {(PROJECT_SCOPES || []).find((scope) => selectedScope === scope.key)?.label}
            </div>
            <div className="px-2 py-0.5 flex-shrink-0 bg-accent-primary/20 text-accent-primary text-11 font-semibold rounded-xl">
              {selectedScopeCount}
            </div>
          </div>
          <ChevronDownIcon className="h-3 w-3" strokeWidth={2} />
        </div>
        <div className="flex md:hidden text-13 items-center gap-2 text-secondary justify-center w-full">
          <span>{(PROJECT_SCOPES || []).find((scope) => selectedScope === scope.key)?.label}</span>
          <ChevronDownIcon className="h-3 w-3 hidden md:flex" strokeWidth={2} />
        </div>
      </>
    );
  }

  function DropdownOptions() {
    return (PROJECT_SCOPES || []).map((scope) => (
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
        <div className="truncate font-medium text-11">{scope?.label}</div>
        <div className="px-2 py-0.5 flex-shrink-0 bg-accent-primary/20 text-accent-primary text-11 font-semibold rounded-xl">
          {scopeProjectsCount?.[scope.key]}
        </div>
      </CustomMenu.MenuItem>
    ));
  }

  return selectedScope ? (
    <CustomMenu
      maxHeight={"md"}
      // className={cn(getButtonStyling("secondary", "lg"), className)}
      placement="bottom-start"
      customButton={
        <Button variant="secondary" size="lg">
          <DropdownLabel />
        </Button>
      }
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
