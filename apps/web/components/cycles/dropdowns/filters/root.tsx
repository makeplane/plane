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
import type { TCycleFilters, TCycleGroups } from "@plane/types";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { FilterEndDate } from "./end-date";
import { FilterStartDate } from "./start-date";
import { FilterStatus } from "./status";

type Props = {
  filters: TCycleFilters;
  handleFiltersUpdate: (key: keyof TCycleFilters, value: string | string[]) => void;
  isArchived?: boolean;
};

export const CycleFiltersSelection = observer(function CycleFiltersSelection(props: Props) {
  const { filters, handleFiltersUpdate, isArchived = false } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // hooks
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
        {/* cycle status */}
        {!isArchived && (
          <div className="py-2">
            <FilterStatus
              appliedFilters={(filters.status as TCycleGroups[]) ?? null}
              handleUpdate={(val) => handleFiltersUpdate("status", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* start date */}
        <div className="py-2">
          <FilterStartDate
            appliedFilters={filters.start_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* end date */}
        <div className="py-2">
          <FilterEndDate
            appliedFilters={filters.end_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("end_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
