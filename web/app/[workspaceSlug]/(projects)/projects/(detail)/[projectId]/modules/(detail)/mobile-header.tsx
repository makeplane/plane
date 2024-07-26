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
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "@/components/issues";
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
import { useIssues, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";

export const ModuleIssuesMobileHeader = observer(() => {
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const { currentProjectDetails } = useProject();
  const { getModuleById } = useModule();
  const layouts = [
    { key: "list", title: "List", icon: List },
    { key: "kanban", title: "Kanban", icon: Kanban },
    { key: "calendar", title: "Calendar", icon: Calendar },
  ];
  const { workspaceSlug, projectId, moduleId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;

  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  const activeLayout = issueFilters?.displayFilters?.layout;
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
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

      updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues }, moduleId);
    },
    [workspaceSlug, projectId, moduleId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
  );

  return (
    <div className="block md:hidden">
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
      />
      <div className="flex justify-evenly border-b border-custom-border-200 bg-custom-background-100 py-2">
        <CustomMenu
          maxHeight={"md"}
          className="flex flex-grow justify-center text-sm text-custom-text-200"
          placement="bottom-start"
          customButton={<span className="flex flex-grow justify-center text-sm text-custom-text-200">Layout</span>}
          customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
          closeOnSelect
        >
          {layouts.map((layout, index) => (
            <CustomMenu.MenuItem
              key={layout.key}
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
              ignoreGroupedFilters={["module"]}
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
    </div>
  );
});
