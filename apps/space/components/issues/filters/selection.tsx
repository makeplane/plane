/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
// types
import type { IIssueFilterOptions, TIssueFilterKeys } from "@/types/issue";
// local imports
import { FilterPriority } from "./priority";
import { FilterState } from "./state";

type Props = {
  filters: IIssueFilterOptions;
  handleFilters: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  layoutDisplayFiltersOptions: TIssueFilterKeys[];
};

export const FilterSelection = observer(function FilterSelection(props: Props) {
  const { filters, handleFilters, layoutDisplayFiltersOptions } = props;

  const { t } = useTranslation();
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => layoutDisplayFiltersOptions.includes(filter);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="pb-2">
        <InputGroup size="md">
          <Icon icon={SearchOutline} size="md" tint="placeholder" />
          <Input
            type="text"
            size="md"
            aria-label={t("search")}
            placeholder={t("search")}
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
            autoFocus
          />
          {filtersSearchQuery !== "" && (
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={t("common.clear")}
              showTooltip={false}
              icon={<Icon icon={CloseOutline} />}
              onClick={() => setFiltersSearchQuery("")}
            />
          )}
        </InputGroup>
      </div>
      <div className="h-full w-full divide-y divide-subtle-1 overflow-y-auto [&>*:last-child]:pb-0">
        {/* priority */}
        {isFilterEnabled("priority") && (
          <div className="py-2">
            <FilterPriority
              appliedFilters={filters.priority ?? null}
              handleUpdate={(val) => handleFilters("priority", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* state */}
        {isFilterEnabled("state") && (
          <div className="py-2">
            <FilterState
              appliedFilters={filters.state ?? null}
              handleUpdate={(val) => handleFilters("state", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}
      </div>
    </div>
  );
});
