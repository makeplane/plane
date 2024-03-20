import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// hooks
// constants
// ui
import { Breadcrumbs, LayersIcon, Tooltip } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "@/components/issues";
import { ProjectLogo } from "@/components/project";
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// helpers
import { useIssues, useLabel, useMember, useProject, useProjectState } from "@/hooks/store";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";

export const ProjectArchivedIssuesHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();
  // for archived issues list layout is the only option
  const activeLayout = "list";
  // hooks
  const { isMobile } = usePlatformOS();
  const handleFiltersUpdate = (key: keyof IIssueFilterOptions, value: string | string[]) => {
    if (!workspaceSlug || !projectId) return;

    const newValues = issueFilters?.filters?.[key] ?? [];

    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (!newValues.includes(val)) newValues.push(val);
      });
    } else {
      if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
      else newValues.push(value);
    }

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      [key]: newValues,
    });
  };

  const handleDisplayFiltersUpdate = (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
    if (!workspaceSlug || !projectId) return;

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, {
      ...issueFilters?.displayFilters,
      ...updatedDisplayFilter,
    });
  };

  const handleDisplayPropertiesUpdate = (property: Partial<IIssueDisplayProperties>) => {
    if (!workspaceSlug || !projectId) return;

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.DISPLAY_PROPERTIES, property);
  };

  const issueCount = currentProjectDetails
    ? issueFilters?.displayFilters?.sub_issue
      ? currentProjectDetails.archived_issues + currentProjectDetails.archived_sub_issues
      : currentProjectDetails.archived_issues
    : undefined;

  return (
    <div className="relative z-10 flex h-14 w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={router.back}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                      </span>
                    )
                  }
                />
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label="Archived issues"
                  icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
          </Breadcrumbs>
          {issueCount && issueCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`There are ${issueCount} ${issueCount > 1 ? "issues" : "issue"} in project's archived`}
              position="bottom"
            >
              <span className="cursor-default flex items-center text-center justify-center px-2.5 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
                {issueCount}
              </span>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {/* filter options */}
      <div className="flex items-center gap-2">
        <FiltersDropdown title="Filters" placement="bottom-end">
          <FilterSelection
            filters={issueFilters?.filters || {}}
            handleFiltersUpdate={handleFiltersUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.archived_issues[activeLayout] : undefined
            }
            labels={projectLabels}
            memberIds={projectMemberIds ?? undefined}
            states={projectStates}
          />
        </FiltersDropdown>
        <FiltersDropdown title="Display" placement="bottom-end">
          <DisplayFiltersSelection
            displayFilters={issueFilters?.displayFilters || {}}
            displayProperties={issueFilters?.displayProperties || {}}
            handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
            handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
