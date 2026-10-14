/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { FilterOutline, SelectedFilterOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
// components
import { AddFilterButton } from "@/components/rich-filters/add-filters/button";

type TFiltersToggleProps<P extends TFilterProperty, E extends TExternalFilter> = {
  filter: IFilterInstance<P, E> | undefined;
};

export const FiltersToggle = observer(function FiltersToggle<P extends TFilterProperty, E extends TExternalFilter>(
  props: TFiltersToggleProps<P, E>
) {
  const { filter } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const hasAnyConditions = (filter?.allConditionsForDisplay.length ?? 0) > 0;
  const isFilterRowVisible = filter?.isVisible ?? false;
  const hasUpdates = filter?.canUpdateView === true && filter?.hasChanges === true;
  const showFilterRowChangesPill = hasUpdates || hasAnyConditions === true;
  const showAddFilterButton = !hasAnyConditions && !isFilterRowVisible && !hasUpdates;

  const handleToggleFilter = () => {
    if (!filter) {
      console.error("Filters toggle error - filter instance not available");
      return;
    }
    filter.toggleVisibility();
  };

  const iconClassName = cn({
    "text-accent-primary [&_path]:fill-current": showFilterRowChangesPill,
  });

  // Show the add filter button when there are no active conditions, the filter row is hidden, and no unsaved changes exist
  if (filter && showAddFilterButton) {
    return (
      <AddFilterButton
        filter={filter}
        buttonConfig={{
          variant: "secondary",
          size: "md",
          label: null,
        }}
        onFilterSelect={() => filter?.toggleVisibility(true)}
      />
    );
  }

  const FilterIcon = showFilterRowChangesPill ? SelectedFilterOutline : FilterOutline;

  return (
    <IconButton
      size="md"
      // Active filters: a filled chrome plus an accent glyph (Propel has no tinted-accent variant).
      variant={showFilterRowChangesPill ? "tertiary" : "secondary"}
      icon={<Icon icon={<FilterIcon className={iconClassName} />} />}
      onClick={handleToggleFilter}
      aria-label={t("common.filters")}
      aria-pressed={isFilterRowVisible}
    />
  );
});
