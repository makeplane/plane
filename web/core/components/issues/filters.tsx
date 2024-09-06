"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// ui
import { Button } from "@plane/ui";

import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// constants
import {
  EIssueFilterType,
  EIssuesStoreType,
  EIssueLayoutTypes,
  ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
} from "@/constants/issue";
// helpers
import { isIssueFilterActive } from "@/helpers/filter.helper";
// hooks
import { useLabel, useProjectState, useMember, useIssues } from "@/hooks/store";
// plane web types
import { TProject } from "@/plane-web/types";
// local components
import { ProjectAnalyticsModal } from "../analytics";

type Props = {
  currentProjectDetails: TProject | undefined;
  projectId: string;
  workspaceSlug: string;
  canUserCreateIssue: boolean | undefined;
};
const HeaderFilters = observer(({ currentProjectDetails, projectId, workspaceSlug, canUserCreateIssue }: Props) => {
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // store hooks
  const {
    project: { projectMemberIds },
  } = useMember();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT);

  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
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

      updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues });
    },
    [workspaceSlug, projectId, issueFilters, updateFilters]
  );
  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={currentProjectDetails ?? undefined}
      />
      <LayoutSelection
        layouts={[
          EIssueLayoutTypes.LIST,
          EIssueLayoutTypes.KANBAN,
          EIssueLayoutTypes.CALENDAR,
          EIssueLayoutTypes.SPREADSHEET,
          EIssueLayoutTypes.GANTT,
        ]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />
      <FiltersDropdown title="Filters" placement="bottom-end" isFiltersApplied={isIssueFilterActive(issueFilters)}>
        <FilterSelection
          filters={issueFilters?.filters ?? {}}
          handleFiltersUpdate={handleFiltersUpdate}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          layoutDisplayFiltersOptions={activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined}
          labels={projectLabels}
          memberIds={projectMemberIds ?? undefined}
          states={projectStates}
          cycleViewDisabled={!currentProjectDetails?.cycle_view}
          moduleViewDisabled={!currentProjectDetails?.module_view}
        />
      </FiltersDropdown>
      <FiltersDropdown title="Display" placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          displayProperties={issueFilters?.displayProperties ?? {}}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
          cycleViewDisabled={!currentProjectDetails?.cycle_view}
          moduleViewDisabled={!currentProjectDetails?.module_view}
        />
      </FiltersDropdown>
      {canUserCreateIssue ? (
        <Button className="hidden md:block" onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
          Analytics
        </Button>
      ) : (
        <></>
      )}
    </>
  );
});

export default HeaderFilters;
