"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssueFilterType, EIssuesStoreType, EIssueLayoutTypes, ETeamspaceEntityScope, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// helpers
import { isIssueFilterActive } from "@/helpers/filter.helper";
// hooks
import { useLabel, useMember, useIssues } from "@/hooks/store";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamHeaderFilters = observer((props: Props) => {
  const { teamspaceId, workspaceSlug } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const {
    issuesFilter: { issueFilters, updateFilters, getTeamspaceScope },
  } = useIssues(EIssuesStoreType.TEAM);
  const { workspaceLabels } = useLabel();
  const { getTeamspaceMemberIds } = useTeamspaces();
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;
  const teamspaceMemberIds = getTeamspaceMemberIds(teamspaceId);
  const currentScope = getTeamspaceScope(teamspaceId);
  const memberIds = currentScope === ETeamspaceEntityScope.TEAM ? teamspaceMemberIds : workspaceMemberIds;

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !teamspaceId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.FILTERS, { [key]: newValues });
    },
    [workspaceSlug, teamspaceId, issueFilters, updateFilters]
  );
  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !teamspaceId) return;
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [workspaceSlug, teamspaceId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !teamspaceId) return;
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, teamspaceId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !teamspaceId) return;
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, teamspaceId, updateFilters]
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
      <FiltersDropdown
        title={t("common.filters")}
        placement="bottom-end"
        isFiltersApplied={isIssueFilterActive(issueFilters)}
      >
        <FilterSelection
          filters={issueFilters?.filters ?? {}}
          handleFiltersUpdate={handleFiltersUpdate}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues[activeLayout] : undefined
          }
          labels={workspaceLabels}
          memberIds={memberIds ?? undefined}
        />
      </FiltersDropdown>
      <FiltersDropdown title={t("common.display")} placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues[activeLayout] : undefined
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
