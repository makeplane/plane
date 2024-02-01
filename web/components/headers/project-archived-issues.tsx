import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ArrowLeft } from "lucide-react";
// hooks
import { useIssues, useLabel, useMember, useProject, useProjectState } from "hooks/store";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
// ui
import { Breadcrumbs, LayersIcon } from "@plane/ui";
// components
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "components/issues";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// types
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";

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

  return (
    <div className="relative z-10 flex h-14 w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle />
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => router.back()}
          >
            <ArrowLeft fontSize={14} strokeWidth={2} />
          </button>
        </div>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails?.emoji ? (
                      renderEmoji(currentProjectDetails.emoji)
                    ) : currentProjectDetails?.icon_prop ? (
                      renderEmoji(currentProjectDetails.icon_prop)
                    ) : (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                        {currentProjectDetails?.name.charAt(0)}
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
                  label="Archived Issues"
                  icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
          </Breadcrumbs>
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
