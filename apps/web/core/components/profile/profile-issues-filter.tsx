import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import {
  EIssuesStoreType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  EIssueLayoutTypes,
} from "@plane/types";
// components
import { isIssueFilterActive } from "@plane/utils";
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown, LayoutSelection } from "@/components/issues";
// helpers
// hooks
import { useIssues, useLabel } from "@/hooks/store";

export const ProfileIssuesFilter = observer(() => {
  // i18n
  const { t } = useTranslation();
  // router
  const { workspaceSlug, userId } = useParams();
  // store hook
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  const { workspaceLabels } = useLabel();
  // derived values
  const states = undefined;
  const members = undefined;
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
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

  return (
    <div className="relative flex items-center justify-end gap-2">
      <LayoutSelection
        layouts={[EIssueLayoutTypes.LIST, EIssueLayoutTypes.KANBAN]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />

      <FiltersDropdown
        title={t("common.filters")}
        placement="bottom-end"
        isFiltersApplied={isIssueFilterActive(issueFilters)}
      >
        <FilterSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.profile_issues[activeLayout] : undefined
          }
          filters={issueFilters?.filters ?? {}}
          handleFiltersUpdate={handleFiltersUpdate}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          states={states}
          labels={workspaceLabels}
          memberIds={members}
        />
      </FiltersDropdown>

      <FiltersDropdown title={t("common.display")} placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.profile_issues[activeLayout] : undefined
          }
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          displayProperties={issueFilters?.displayProperties ?? {}}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
        />
      </FiltersDropdown>
    </div>
  );
});
