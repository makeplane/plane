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
import { EIssuesStoreType, IIssueDisplayFilterOptions, IIssueDisplayProperties, EIssueLayoutTypes } from "@plane/types";
// components
import { DisplayFiltersSelection, FiltersDropdown, LayoutSelection } from "@/components/issues/issue-layouts/filters";
// helpers
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useIssues } from "@/hooks/store/use-issues";

type Props = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamHeaderFilters = observer((props: Props) => {
  const { teamspaceId, workspaceSlug } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.TEAM);
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !teamspaceId) return;
      captureClick({
        elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_UPDATE_LAYOUT_BUTTON,
      });
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout })
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
    [workspaceSlug, teamspaceId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !teamspaceId) return;
      captureClick({
        elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_UPDATE_DISPLAY_FILTER_BUTTON,
      });
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter)
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
    [workspaceSlug, teamspaceId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !teamspaceId) return;
      captureClick({
        elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_UPDATE_DISPLAY_PROPERTY_BUTTON,
      });
      updateFilters(workspaceSlug, teamspaceId, EIssueFilterType.DISPLAY_PROPERTIES, property)
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
      <FiltersDropdown title={t("common.display")} placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues.layoutOptions[activeLayout] : undefined
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
