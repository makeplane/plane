"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Calendar, ChevronDown, Kanban, List } from "lucide-react";
// plane imports
import { EIssueFilterType, ISSUE_LAYOUTS, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, EIssueLayoutTypes } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// components
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";

const SUPPORTED_LAYOUTS = [
  { key: "list", i18n_title: "issue.layouts.list", icon: List },
  { key: "kanban", i18n_title: "issue.layouts.kanban", icon: Kanban },
  { key: "calendar", i18n_title: "issue.layouts.calendar", icon: Calendar },
];

export const ModuleIssuesMobileHeader = observer(() => {
  // router
  const { workspaceSlug, projectId, moduleId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectDetails } = useProject();
  const { getModuleById } = useModule();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
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
      <WorkItemsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
        projectDetails={currentProjectDetails}
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
          {SUPPORTED_LAYOUTS.map((layout, index) => (
            <CustomMenu.MenuItem
              key={layout.key}
              onClick={() => {
                handleLayoutChange(ISSUE_LAYOUTS[index].key);
              }}
              className="flex items-center gap-2"
            >
              <IssueLayoutIcon layout={ISSUE_LAYOUTS[index].key} className="h-3 w-3" />
              <div className="text-custom-text-300">{t(layout.i18n_title)}</div>
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
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
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[activeLayout] : undefined
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
