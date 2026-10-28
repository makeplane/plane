/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import type { TModuleStatus } from "@plane/blocks/icons";
// plane imports
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
import type { TModuleDisplayFilters, TModuleFilters } from "@plane/types";
// components
import { ModuleFilterGroup, ModuleFilterOption as FilterOption, useModuleFilterMenu } from "./menu-controls";
import { FilterLead, FilterMembers, FilterStartDate, FilterStatus, FilterTargetDate } from "@/components/modules";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  displayFilters: TModuleDisplayFilters;
  filters: TModuleFilters;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TModuleDisplayFilters>) => void;
  handleFiltersUpdate: (key: keyof TModuleFilters, value: string | string[]) => void;
  memberIds?: string[] | undefined;
  isArchived?: boolean;
};

export const ModuleFiltersSelection = observer(function ModuleFiltersSelection(props: Props) {
  const {
    displayFilters,
    filters,
    handleDisplayFiltersUpdate,
    handleFiltersUpdate,
    memberIds,
    isArchived = false,
  } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // store
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const menu = useModuleFilterMenu();
  const searchQuery = menu?.searchQuery ?? filtersSearchQuery;

  const content = (
    <>
      {!isArchived && (
        <ModuleFilterGroup separator={false}>
          <FilterOption
            isChecked={!!displayFilters.favorites}
            onClick={() =>
              handleDisplayFiltersUpdate({
                favorites: !displayFilters.favorites,
              })
            }
            title="Favorites"
          />
        </ModuleFilterGroup>
      )}

      {/* status */}
      {!isArchived && (
        <ModuleFilterGroup>
          <FilterStatus
            appliedFilters={(filters.status as TModuleStatus[]) ?? null}
            handleUpdate={(val) => handleFiltersUpdate("status", val)}
            searchQuery={searchQuery}
          />
        </ModuleFilterGroup>
      )}

      {/* lead */}
      <ModuleFilterGroup separator={!isArchived}>
        <FilterLead
          appliedFilters={filters.lead ?? null}
          handleUpdate={(val) => handleFiltersUpdate("lead", val)}
          searchQuery={searchQuery}
          memberIds={memberIds}
        />
      </ModuleFilterGroup>

      {/* members */}
      <ModuleFilterGroup>
        <FilterMembers
          appliedFilters={filters.members ?? null}
          handleUpdate={(val) => handleFiltersUpdate("members", val)}
          searchQuery={searchQuery}
          memberIds={memberIds}
        />
      </ModuleFilterGroup>

      {/* start date */}
      <ModuleFilterGroup>
        <FilterStartDate
          appliedFilters={filters.start_date ?? null}
          handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
          searchQuery={searchQuery}
        />
      </ModuleFilterGroup>

      {/* target date */}
      <ModuleFilterGroup>
        <FilterTargetDate
          appliedFilters={filters.target_date ?? null}
          handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
          searchQuery={searchQuery}
        />
      </ModuleFilterGroup>
    </>
  );

  return menu ? (
    content
  ) : (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-surface-1 p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-caption-sm-regular">
          <SearchOutline className="text-placeholder" width={12} height={12} />
          <input
            type="text"
            className="w-full bg-surface-2 outline-none placeholder:text-placeholder"
            placeholder="Search"
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- preserve the existing desktop filter-search focus
            autoFocus={!isMobile}
          />
          {filtersSearchQuery !== "" && (
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("common.clear")}
              showTooltip={!isMobile}
              onClick={() => setFiltersSearchQuery("")}
              icon={<Icon icon={CloseOutline} />}
            />
          )}
        </div>
      </div>
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5">
        {content}
      </div>
    </div>
  );
});
