import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// ui
import { Breadcrumbs, Button, LayersIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection } from "@/components/issues";
import { CreateUpdateWorkspaceViewModal } from "@/components/workspace";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useLabel, useMember, useUser, useIssues } from "@/hooks/store";

export const GlobalIssuesHeader: React.FC = observer(() => {
  // states
  const [createViewModal, setCreateViewModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;
  // store hooks
  const {
    issuesFilter: { filters, updateFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { workspaceLabels } = useLabel();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const issueFilters = globalViewId ? filters[globalViewId.toString()] : undefined;

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !globalViewId) return;
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

      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        globalViewId.toString()
      );
    },
    [workspaceSlug, issueFilters, updateFilters, globalViewId]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        globalViewId.toString()
      );
    },
    [workspaceSlug, updateFilters, globalViewId]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !globalViewId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_PROPERTIES,
        property,
        globalViewId.toString()
      );
    },
    [workspaceSlug, updateFilters, globalViewId]
  );

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  const isFiltersApplied = calculateTotalFilters(issueFilters?.filters ?? {}) !== 0;

  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div className="relative z-[15] flex h-[3.75rem] w-full items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
        <div className="relative flex gap-2">
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink label={`All Issues`} icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />} />
              }
            />
          </Breadcrumbs>
        </div>
        <div className="flex items-center gap-2">
          <>
            <FiltersDropdown title="Filters" placement="bottom-end" isFiltersApplied={isFiltersApplied}>
              <FilterSelection
                layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                filters={issueFilters?.filters ?? {}}
                handleFiltersUpdate={handleFiltersUpdate}
                labels={workspaceLabels ?? undefined}
                memberIds={workspaceMemberIds ?? undefined}
              />
            </FiltersDropdown>
            <FiltersDropdown title="Display" placement="bottom-end">
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                displayProperties={issueFilters?.displayProperties ?? {}}
                handleDisplayPropertiesUpdate={handleDisplayProperties}
              />
            </FiltersDropdown>
          </>
          {isAuthorizedUser && (
            <Button variant="primary" size="sm" onClick={() => setCreateViewModal(true)}>
              Add View
            </Button>
          )}
        </div>
      </div>
    </>
  );
});
