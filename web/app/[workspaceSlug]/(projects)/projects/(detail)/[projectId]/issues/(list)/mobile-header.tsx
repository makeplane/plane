"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Calendar, ChevronDown, Kanban, List } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { ProjectAnalyticsModal } from "@/components/analytics";
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "@/components/issues/issue-layouts";
// constants
import {
  EIssueFilterType,
  EIssueLayoutTypes,
  EIssuesStoreType,
  ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
  ISSUE_LAYOUTS,
} from "@/constants/issue";
// helpers
import { isIssueFilterActive } from "@/helpers/filter.helper";
// hooks
import { useIssues, useLabel, useMember, useProject, useProjectState } from "@/hooks/store";

export const ProjectIssuesMobileHeader = observer(() => {
  const layouts = [
    { key: "list", title: "List", icon: List },
    { key: "kanban", title: "Kanban", icon: Kanban },
    { key: "calendar", title: "Calendar", icon: Calendar },
  ];
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const { workspaceSlug, projectId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
  };
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();

  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    project: { projectMemberIds },
  } = useMember();
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [workspaceSlug, projectId, updateFilters]
  );

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
      <div className="md:hidden flex justify-evenly border-b border-custom-border-200 py-2 z-[13] bg-custom-background-100">
        <CustomMenu
          maxHeight={"md"}
          className="flex flex-grow justify-center text-sm text-custom-text-200"
          placement="bottom-start"
          customButton={
            <div className="flex flex-start text-sm text-custom-text-200">
              Layout
              <ChevronDown className="ml-2  h-4 w-4 text-custom-text-200 my-auto" strokeWidth={2} />
            </div>
          }
          customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
          closeOnSelect
        >
          {layouts.map((layout, index) => (
            <CustomMenu.MenuItem
              key={index}
              onClick={() => {
                handleLayoutChange(ISSUE_LAYOUTS[index].key);
              }}
              className="flex items-center gap-2"
            >
              <layout.icon className="h-3 w-3" />
              <div className="text-custom-text-300">{layout.title}</div>
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
        <div className="flex flex-grow items-center justify-center border-l border-custom-border-200 text-sm text-custom-text-200">
          <FiltersDropdown
            title="Filters"
            placement="bottom-end"
            menuButton={
              <span className="flex items-center text-sm text-custom-text-200">
                Filters
                <ChevronDown className="ml-2  h-4 w-4 text-custom-text-200" />
              </span>
            }
            isFiltersApplied={isIssueFilterActive(issueFilters)}
          >
            <FilterSelection
              filters={issueFilters?.filters ?? {}}
              handleFiltersUpdate={handleFiltersUpdate}
              displayFilters={issueFilters?.displayFilters ?? {}}
              handleDisplayFiltersUpdate={handleDisplayFilters}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              labels={projectLabels}
              memberIds={projectMemberIds ?? undefined}
              states={projectStates}
              cycleViewDisabled={!currentProjectDetails?.cycle_view}
              moduleViewDisabled={!currentProjectDetails?.module_view}
            />
          </FiltersDropdown>
        </div>
        <div className="flex flex-grow items-center justify-center border-l border-custom-border-200 text-sm text-custom-text-200">
          <FiltersDropdown
            title="Display"
            placement="bottom-end"
            menuButton={
              <span className="flex items-center text-sm text-custom-text-200">
                Display
                <ChevronDown className="ml-2 h-4 w-4 text-custom-text-200" />
              </span>
            }
          >
            <DisplayFiltersSelection
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              displayFilters={issueFilters?.displayFilters ?? {}}
              handleDisplayFiltersUpdate={handleDisplayFilters}
              displayProperties={issueFilters?.displayProperties ?? {}}
              handleDisplayPropertiesUpdate={handleDisplayProperties}
              cycleViewDisabled={!currentProjectDetails?.cycle_view}
              moduleViewDisabled={!currentProjectDetails?.module_view}
            />
          </FiltersDropdown>
        </div>

        <button
          onClick={() => setAnalyticsModal(true)}
          className="flex flex-grow justify-center border-l border-custom-border-200 text-sm text-custom-text-200"
        >
          Analytics
        </button>
      </div>
    </>
  );
});
