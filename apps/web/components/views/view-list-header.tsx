/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
// icons
import { FilterOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { FiltersDropdown } from "../issues/issue-layouts/filters";
import { ViewFiltersSelection } from "./filters/filter-selection";
import { ViewOrderByDropdown } from "./filters/order-by";

export const ViewListHeader = observer(function ViewListHeader() {
  // translation
  const { t } = useTranslation();
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  return (
    <div className="flex h-full items-center gap-2">
      <ExpandableSearch
        size="md"
        aria-label={t("common.search.label")}
        clearLabel={t("common.clear")}
        placeholder={t("common.search.label")}
        value={filters?.searchQuery ?? ""}
        onValueChange={(value) => updateFilters("searchQuery", value)}
      />
      <div className="hidden items-center gap-2 md:flex">
        <ViewOrderByDropdown
          sortBy={filters.sortBy}
          sortKey={filters.sortKey}
          onChange={(val) => {
            if (val.key) updateFilters("sortKey", val.key);
            if (val.order) updateFilters("sortBy", val.order);
          }}
        />
        <FiltersDropdown
          icon={<FilterOutline className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={false}
        >
          <ViewFiltersSelection
            filters={filters}
            handleFiltersUpdate={updateFilters}
            memberIds={projectMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
