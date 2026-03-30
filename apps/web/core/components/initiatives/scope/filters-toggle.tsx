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

import { EIssuesStoreType, INITIATIVE_SCOPE_TABS } from "@plane/types";
import { observer } from "mobx-react";
import { FiltersToggle } from "@/components/rich-filters/filters-toggle";
import { useInitiativeScopeShared } from "./context-shared";
import { useInitiativeScopeProjectFilter } from "./projects/filters/context-project-filter";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";

export const InitiativeScopeFiltersToggle = observer(function InitiativeScopeFiltersToggle({
  initiativeId,
}: {
  initiativeId: string;
}) {
  const { activeTab } = useInitiativeScopeShared();
  const { filterInstance: projectFilterInstance } = useInitiativeScopeProjectFilter();

  // Show project filter toggle when on projects tab
  if (activeTab === INITIATIVE_SCOPE_TABS.PROJECTS) {
    return <FiltersToggle filter={projectFilterInstance ?? undefined} />;
  }

  // Show epic filter toggle when on epics tab
  if (activeTab === INITIATIVE_SCOPE_TABS.EPICS) {
    return <WorkItemFiltersToggle entityType={EIssuesStoreType.INITIATIVE_EPIC} entityId={initiativeId} />;
  }

  return null;
});
