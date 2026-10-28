/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import {
  MenuCheckboxItem,
  MenuSubmenu,
  MenuSubmenuContent,
  MenuSubmenuTrigger,
} from "@makeplane/propel/components/menu";
import { isInDateFormat } from "@plane/utils";
// local imports
import { useDateFilterModal } from "./date-filter-modal-context";
import { FilterSubmenuCount } from "./filter-submenu";

type Props = {
  /** The date property, shown on the row that opens the submenu and as the custom-range modal title. */
  label: string;
  /** Relative presets, e.g. `DATE_AFTER_FILTER_OPTIONS`. */
  options: { name: string; value: string }[];
  appliedFilters: string[] | null | undefined;
  /** Toggles one preset. */
  onToggleOption: (value: string) => void;
  /** Applies the range picked in the custom-range modal. */
  onSelectCustomRange: (value: string[]) => void;
  /** Drops the applied custom range. */
  onClearCustomRange: () => void;
};

/** A custom range is stored as literal `YYYY-MM-DD;after|before` values rather than a preset. */
export const isCustomDateFilterValue = (value: string) => isInDateFormat(value.split(";")[0]);

/**
 * A date property of a filters menu: its relative presets as checkable rows, plus a "Custom" row
 * that opens the custom-range modal through the surrounding `DateFilterModalHost`.
 */
export const DateFilterSubmenu = observer(function DateFilterSubmenu(props: Props) {
  const { label, options, appliedFilters, onToggleOption, onSelectCustomRange, onClearCustomRange } = props;
  // context hooks
  const dateFilterModal = useDateFilterModal();
  // derived values
  const appliedValues = new Set(appliedFilters ?? []);
  const isCustomRangeApplied = (appliedFilters ?? []).some(isCustomDateFilterValue);

  return (
    <MenuSubmenu>
      <MenuSubmenuTrigger label={label} trailing={<FilterSubmenuCount count={appliedFilters?.length ?? 0} />} />
      <MenuSubmenuContent>
        {options.map((option) => (
          <MenuCheckboxItem
            key={option.value}
            label={option.name}
            checked={appliedValues.has(option.value)}
            onCheckedChange={() => onToggleOption(option.value)}
          />
        ))}
        {dateFilterModal && (
          <MenuCheckboxItem
            label="Custom"
            checked={isCustomRangeApplied}
            // picking a range opens a modal, so the menu steps aside; clearing one keeps it open
            closeOnClick={!isCustomRangeApplied}
            onCheckedChange={() => {
              if (isCustomRangeApplied) onClearCustomRange();
              else dateFilterModal.openDateFilterModal({ title: label, onSelect: onSelectCustomRange });
            }}
          />
        )}
      </MenuSubmenuContent>
    </MenuSubmenu>
  );
});
