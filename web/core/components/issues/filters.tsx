"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane constants
import { EIssueLayoutTypes, EIssueFilterType, EIssuesStoreType } from "@plane/constants";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// constants
import { ISSUE_STORE_TO_FILTERS_MAP } from "@/constants/issue";
// helpers
import { isIssueFilterActive } from "@/helpers/filter.helper";
// hooks
import { useLabel, useProjectState, useMember, useIssues } from "@/hooks/store";
// plane web types
import { TProject } from "@/plane-web/types";
import { ProjectAnalyticsModal } from "../analytics";

type Props = {
  currentProjectDetails: TProject | undefined;
  projectId: string;
  workspaceSlug: string;
  canUserCreateIssue: boolean | undefined;
  storeType?: EIssuesStoreType.PROJECT | EIssuesStoreType.EPIC;
};
const HeaderFilters = observer((props: Props) => {
  const {
    currentProjectDetails,
    projectId,
    workspaceSlug,
    canUserCreateIssue,
    storeType = EIssuesStoreType.PROJECT,
  } = props;
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // store hooks
  const {
    project: { projectMemberIds },
  } = useMember();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(storeType);
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;
  const layoutDisplayFiltersOptions = ISSUE_STORE_TO_FILTERS_MAP[storeType]?.[activeLayout];

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
          layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
          labels={projectLabels}
          memberIds={projectMemberIds ?? undefined}
          projectId={projectId}
          states={projectStates}
          cycleViewDisabled={!currentProjectDetails?.cycle_view}
          moduleViewDisabled={!currentProjectDetails?.module_view}
          isEpic={storeType === EIssuesStoreType.EPIC}
        />
      </FiltersDropdown>
      <FiltersDropdown title="Display" placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          displayProperties={issueFilters?.displayProperties ?? {}}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
          cycleViewDisabled={!currentProjectDetails?.cycle_view}
          moduleViewDisabled={!currentProjectDetails?.module_view}
          isEpic={storeType === EIssuesStoreType.EPIC}
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
