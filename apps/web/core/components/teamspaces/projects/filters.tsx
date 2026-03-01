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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { DisplayFiltersSelection, FiltersDropdown, LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { useIssues } from "@/hooks/store/use-issues";

type Props = {
  teamspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

export const TeamspaceProjectWorkItemFilters = observer(function TeamspaceProjectWorkItemFilters(props: Props) {
  const { teamspaceId, workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS);
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !teamspaceId) return;
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, projectId);
    },
    [workspaceSlug, teamspaceId, updateFilters, projectId]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !teamspaceId) return;
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, projectId);
    },
    [workspaceSlug, teamspaceId, updateFilters, projectId]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !teamspaceId) return;
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_PROPERTIES, property, projectId);
    },
    [workspaceSlug, teamspaceId, updateFilters, projectId]
  );

  return (
    <>
      <LayoutSelection
        layouts={[
          EIssueLayoutTypes.LIST,
          EIssueLayoutTypes.KANBAN,
          EIssueLayoutTypes.CALENDAR,
          EIssueLayoutTypes.SPREADSHEET,
        ]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />
      <WorkItemFiltersToggle entityType={EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS} entityId={projectId} />
      <FiltersDropdown title={t("common.display")} placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_project_work_items.layoutOptions[activeLayout] : undefined
          }
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          displayProperties={issueFilters?.displayProperties ?? {}}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
        />
      </FiltersDropdown>
    </>
  );
});
