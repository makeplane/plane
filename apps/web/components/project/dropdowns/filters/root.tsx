/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TProjectDisplayFilters, TProjectFilters } from "@plane/types";
// components
import { FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { FilterAccess } from "./access";
import { FilterCreatedDate } from "./created-at";
import { FilterLead } from "./lead";
import { FilterMembers } from "./members";

type Props = {
  displayFilters: TProjectDisplayFilters;
  filters: TProjectFilters;
  handleFiltersUpdate: (key: keyof TProjectFilters, value: string | string[]) => void;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TProjectDisplayFilters>) => void;
  memberIds?: string[] | undefined;
};

export const ProjectFiltersSelection = observer(function ProjectFiltersSelection(props: Props) {
  const { displayFilters, filters, handleFiltersUpdate, handleDisplayFiltersUpdate, memberIds } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // store
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-surface-1 p-2.5 pb-0">
        <InputGroup size="md">
          <Icon icon={SearchOutline} tint="placeholder" />
          <Input
            size="md"
            aria-label={t("common.search.label")}
            type="text"
            placeholder={t("common.search.label")}
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
        </InputGroup>
      </div>
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5">
        <div className="py-2">
          <FilterOption
            isChecked={!!displayFilters.my_projects}
            onClick={() =>
              handleDisplayFiltersUpdate({
                my_projects: !displayFilters.my_projects,
              })
            }
            title="My projects"
          />
        </div>

        {/* access */}
        <div className="py-2">
          <FilterAccess
            appliedFilters={filters.access ?? null}
            handleUpdate={(val) => handleFiltersUpdate("access", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* lead */}
        <div className="py-2">
          <FilterLead
            appliedFilters={filters.lead ?? null}
            handleUpdate={(val) => handleFiltersUpdate("lead", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* members */}
        <div className="py-2">
          <FilterMembers
            appliedFilters={filters.members ?? null}
            handleUpdate={(val) => handleFiltersUpdate("members", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* created date */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={filters.created_at ?? null}
            handleUpdate={(val) => handleFiltersUpdate("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
