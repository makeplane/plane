import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { ChevronDown } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "@/components/issues";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT, ISSUE_LAYOUTS } from "@/constants/issue";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useIssues, useLabel } from "@/hooks/store";

const ProfileIssuesMobileHeader = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;
  // store hook
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  const { workspaceLabels } = useLabel();
  // derived values
  const states = undefined;
  // const members = undefined;
  // const activeLayout = issueFilters?.displayFilters?.layout;
  // const states = undefined;
  const members = undefined;
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !userId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { layout: layout },
        userId.toString()
      );
    },
    [workspaceSlug, updateFilters, userId]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !userId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
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
        userId.toString()
      );
    },
    [workspaceSlug, issueFilters, updateFilters, userId]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !userId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        userId.toString()
      );
    },
    [workspaceSlug, updateFilters, userId]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !userId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_PROPERTIES,
        property,
        userId.toString()
      );
    },
    [workspaceSlug, updateFilters, userId]
  );

  const isFiltersApplied = calculateTotalFilters(issueFilters?.filters ?? {}) !== 0;

  return (
    <div className="flex justify-evenly border-b border-custom-border-200 py-2 md:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-center text-sm text-custom-text-200"
        placement="bottom-start"
        customButton={<span className="flex flex-grow justify-center text-sm text-custom-text-200">Layout</span>}
        customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
        closeOnSelect
      >
        {ISSUE_LAYOUTS.map((layout, index) => {
          if (layout.key === "spreadsheet" || layout.key === "gantt_chart" || layout.key === "calendar") return;
          return (
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
          );
        })}
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
          isFiltersApplied={isFiltersApplied}
        >
          <FilterSelection
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
            }
            filters={issueFilters?.filters ?? {}}
            handleFiltersUpdate={handleFiltersUpdate}
            states={states}
            labels={workspaceLabels}
            memberIds={members}
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
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
            }
            displayFilters={issueFilters?.displayFilters ?? {}}
            handleDisplayFiltersUpdate={handleDisplayFilters}
            displayProperties={issueFilters?.displayProperties ?? {}}
            handleDisplayPropertiesUpdate={handleDisplayProperties}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});

export default ProfileIssuesMobileHeader;
