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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useQueryParams } from "@/hooks/use-query-params";
// local imports
import type { TWorkItemTypesTab } from "../work-item-types-tabs";
import { TABS_LIST, WorkItemTypesSettingsTabs } from "../work-item-types-tabs";
import { WorkspaceWorkItemTypesHierarchyTabContent } from "./hierarchy-tab-content";
import { WorkspacePropertiesTabContent } from "./properties-tab-content";
import { WorkspaceWorkItemTypesTypesTabContent } from "./types-tab-content";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceWorkItemTypesSettingsRoot = observer(function WorkspaceWorkItemTypesSettingsRoot({
  workspaceSlug,
}: Props) {
  // params
  const [searchParams] = useSearchParams();
  const router = useAppRouter();
  // query params manipulation
  const { updateQueryParams } = useQueryParams();
  const queryParamTab = searchParams.get("tab");
  const resolvedTab: TWorkItemTypesTab = useMemo(
    () => (TABS_LIST.includes(queryParamTab as TWorkItemTypesTab) ? (queryParamTab as TWorkItemTypesTab) : "types"),
    [queryParamTab]
  );

  const handleActiveTabChange = useCallback(
    (tab: TWorkItemTypesTab) => {
      const updatedRoute = updateQueryParams({
        paramsToAdd: { tab },
      });
      router.replace(updatedRoute);
    },
    [router, updateQueryParams]
  );

  return (
    <WorkItemTypesSettingsTabs
      activeTab={resolvedTab}
      handleActiveTabChange={handleActiveTabChange}
      tabs={{
        TypesTab: <WorkspaceWorkItemTypesTypesTabContent workspaceSlug={workspaceSlug} />,
        PropertiesTab: <WorkspacePropertiesTabContent workspaceSlug={workspaceSlug} />,
        HierarchyTab: <WorkspaceWorkItemTypesHierarchyTabContent workspaceSlug={workspaceSlug} />,
      }}
    />
  );
});
