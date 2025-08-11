"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS,
  TEAMSPACE_WORK_ITEM_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  EIssuesStoreType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  EIssueLayoutTypes,
} from "@plane/types";
import { isIssueFilterActive } from "@plane/utils";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// helpers
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useLabel, useIssues } from "@/hooks/store";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

export const TeamspaceProjectWorkItemFilters = observer((props: Props) => {
  const { teamspaceId, workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS);
  const { workspaceLabels } = useLabel();
  const { getTeamspaceMemberIds } = useTeamspaces();
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;
  const teamspaceMemberIds = getTeamspaceMemberIds(teamspaceId);

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

      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.FILTERS, { [key]: newValues }, projectId);
    },
    [workspaceSlug, teamspaceId, issueFilters?.filters, updateFilters, projectId]
  );
  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !teamspaceId) return;
      captureClick({
        elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_UPDATE_LAYOUT_BUTTON,
      });
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, projectId)
        .then(() => {
          captureSuccess({
            eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.LAYOUT_UPDATE,
          });
        })
        .catch(() => {
          captureError({
            eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.LAYOUT_UPDATE,
          });
        });
    },
    [workspaceSlug, teamspaceId, updateFilters, projectId]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !teamspaceId) return;
      captureClick({
        elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_UPDATE_DISPLAY_FILTER_BUTTON,
      });
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, projectId)
        .then(() => {
          captureSuccess({
            eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.DISPLAY_FILTER_UPDATE,
          });
        })
        .catch(() => {
          captureError({
            eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.DISPLAY_FILTER_UPDATE,
          });
        });
    },
    [workspaceSlug, teamspaceId, updateFilters, projectId]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !teamspaceId) return;
      captureClick({
        elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_UPDATE_DISPLAY_PROPERTY_BUTTON,
      });
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_PROPERTIES, property, projectId)
        .then(() => {
          captureSuccess({
            eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.DISPLAY_PROPERTY_UPDATE,
          });
        })
        .catch(() => {
          captureError({
            eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.DISPLAY_PROPERTY_UPDATE,
          });
        });
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
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_project_work_items[activeLayout] : undefined
          }
          labels={workspaceLabels}
          memberIds={teamspaceMemberIds ?? undefined}
        />
      </FiltersDropdown>
      <FiltersDropdown title={t("common.display")} placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_project_work_items[activeLayout] : undefined
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
