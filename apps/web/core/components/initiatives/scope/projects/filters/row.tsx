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

import { RichFiltersRow } from "@/components/rich-filters/filters-row";
import { INITIATIVE_SCOPE_TABS } from "@plane/types";
import { Loader } from "@plane/ui";
import { observer } from "mobx-react";
import { useInitiativeScopeProjectFilter } from "./context-project-filter";
import { useInitiativeScopeShared } from "../../context-shared";

export const InitiativeScopeProjectFiltersRow = observer(function InitiativeScopeProjectFiltersRow() {
  const { activeTab } = useInitiativeScopeShared();
  const { filterInstance: projectFilterInstance, isReady } = useInitiativeScopeProjectFilter();

  // Only show project filters when on projects tab
  if (activeTab !== INITIATIVE_SCOPE_TABS.PROJECTS) return null;

  if (!isReady || !projectFilterInstance) {
    return (
      <div className="px-4 flex flex-wrap justify-between py-2 gap-2 bg-surface-1 z-[12]">
        <Loader.Item height="24px" width="100%" />
      </div>
    );
  }

  return (
    <RichFiltersRow
      filter={projectFilterInstance}
      buttonConfig={{
        variant: "secondary",
        label: "Filters",
        defaultOpen: false,
        className: "bg-surface-1",
      }}
    />
  );
});
