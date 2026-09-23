/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType, ISSUE_LAYOUTS, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// icons
import { ChevronDownOutline } from "@makeplane/propel/icons";
// types
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueLayouts,
  EIssueLayoutTypes,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// ui
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
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
      <Menu>
        <MenuTrigger
          render={<button type="button" className="flex grow items-center justify-center text-13 text-secondary" />}
        >
          {t("common.layout")}
          <ChevronDownOutline className="my-auto ml-2 h-4 w-4 text-secondary" />
        </MenuTrigger>
        <MenuContent side="bottom" align="start">
          {ISSUE_LAYOUTS.map((layout) => {
            if (layout.key === "spreadsheet" || layout.key === "gantt_chart" || layout.key === "calendar") return null;
            return (
              <MenuItem
                key={layout.key}
                label={t(layout.i18n_title)}
                icon={<Icon icon={<IssueLayoutIcon layout={layout.key} className="size-3" />} />}
                onClick={() => {
                  handleLayoutChange(layout.key);
                }}
              />
            );
          })}
        </MenuContent>
      </Menu>
      <div className="flex grow items-center justify-center border-l border-subtle text-13 text-secondary">
        <FiltersDropdown
          title={t("common.display")}
          placement="bottom-end"
          menuButton={
            <div className="flex-center flex text-13 text-secondary">
              {t("common.display")}
              <ChevronDownOutline className="ml-2 h-4 w-4 text-secondary" />
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
