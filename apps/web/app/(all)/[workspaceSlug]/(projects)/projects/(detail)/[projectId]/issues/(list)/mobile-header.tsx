"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  MobileLayoutSelection,
} from "@/components/issues/issue-layouts/filters";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";

export const ProjectIssuesMobileHeader = observer(() => {
  // i18n
  const { t } = useTranslation();
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const { workspaceSlug, projectId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
  };
  const { currentProjectDetails } = useProject();

  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT);
  const activeLayout = issueFilters?.displayFilters?.layout;

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
      <WorkItemsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={currentProjectDetails ?? undefined}
      />
      <div className="md:hidden flex justify-evenly border-b border-custom-border-200 py-2 z-[13] bg-custom-background-100">
        <MobileLayoutSelection
          layouts={[EIssueLayoutTypes.LIST, EIssueLayoutTypes.KANBAN, EIssueLayoutTypes.CALENDAR]}
          onChange={handleLayoutChange}
        />
        <div className="flex flex-grow items-center justify-center border-l border-custom-border-200 text-sm text-custom-text-200">
          <FiltersDropdown
            title={t("common.display")}
            placement="bottom-end"
            menuButton={
              <span className="flex items-center text-sm text-custom-text-200">
                {t("common.display")}
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
              cycleViewDisabled={!currentProjectDetails?.cycle_view}
              moduleViewDisabled={!currentProjectDetails?.module_view}
            />
          </FiltersDropdown>
        </div>

        <button
          onClick={() => setAnalyticsModal(true)}
          className="flex flex-grow justify-center border-l border-custom-border-200 text-sm text-custom-text-200"
        >
          {t("common.analytics")}
        </button>
      </div>
    </>
  );
});
