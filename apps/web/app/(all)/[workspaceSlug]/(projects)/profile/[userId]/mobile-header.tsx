import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType, ISSUE_LAYOUTS, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// icons
import { ChevronDownIcon } from "@plane/propel/icons";
// types
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueLayouts,
  EIssueLayoutTypes,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";
// hooks
import { useIssues } from "@/hooks/store/use-issues";

export const ProfileIssuesMobileHeader = observer(function ProfileIssuesMobileHeader() {
  // plane i18n
  const { t } = useTranslation();
  // router
  const { workspaceSlug, userId } = useParams();
  // store hook
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROFILE);
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !userId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { layout: layout as EIssueLayoutTypes | undefined },
        userId.toString()
      );
    },
    [workspaceSlug, updateFilters, userId]
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
    <div className="flex justify-evenly border-b border-subtle py-2 md:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-center text-13 text-secondary"
        placement="bottom-start"
        customButton={
          <div className="flex flex-center text-13 text-secondary">
            {t("common.layout")}
            <ChevronDownIcon className="ml-2  h-4 w-4 text-secondary my-auto" strokeWidth={2} />
          </div>
        }
        customButtonClassName="flex flex-center text-secondary text-13"
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
              <IssueLayoutIcon layout={ISSUE_LAYOUTS[index].key} className="h-3 w-3" />
              <div className="text-tertiary">{t(layout.i18n_title)}</div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
      <div className="flex flex-grow items-center justify-center border-l border-subtle text-13 text-secondary">
        <FiltersDropdown
          title={t("common.display")}
          placement="bottom-end"
          menuButton={
            <div className="flex flex-center text-13 text-secondary">
              {t("common.display")}
              <ChevronDownIcon className="ml-2 h-4 w-4 text-secondary" strokeWidth={2} />
            </div>
          }
        >
          <DisplayFiltersSelection
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.profile_issues.layoutOptions[activeLayout] : undefined
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
