/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import {
  MenuRadioGroup,
  MenuRadioItem,
  MenuSubmenu,
  MenuSubmenuContent,
  MenuSubmenuTrigger,
} from "@makeplane/propel/components/menu";
import { ISSUE_GROUP_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, TIssueGroupByOptions } from "@plane/types";
// local imports
import { DisplayFilterCurrentValue } from "./current-value";

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  handleUpdate: (val: TIssueGroupByOptions) => void;
  subGroupByOptions: TIssueGroupByOptions[];
  ignoreGroupedFilters: Partial<TIssueGroupByOptions>[];
};

export const FilterSubGroupBy = observer(function FilterSubGroupBy(props: Props) {
  const { displayFilters, handleUpdate, subGroupByOptions, ignoreGroupedFilters } = props;
  // hooks
  const { t } = useTranslation();

  const selectedGroupBy = displayFilters.group_by ?? null;
  const selectedSubGroupBy = displayFilters.sub_group_by ?? null;

  const options = ISSUE_GROUP_BY_OPTIONS.filter((option) => {
    if (!subGroupByOptions.includes(option.key)) return false;
    // a board can't group and sub-group by the same property
    if (selectedGroupBy !== null && option.key === selectedGroupBy) return false;
    return !ignoreGroupedFilters.includes(option.key);
  });
  const selectedOption = options.find((option) => option.key === selectedSubGroupBy);

  return (
    <MenuSubmenu>
      <MenuSubmenuTrigger
        label="Sub-group by"
        trailing={
          selectedOption && (
            <DisplayFilterCurrentValue>{t(selectedOption.titleTranslationKey)}</DisplayFilterCurrentValue>
          )
        }
      />
      <MenuSubmenuContent>
        <MenuRadioGroup value={selectedSubGroupBy} onValueChange={(value: TIssueGroupByOptions) => handleUpdate(value)}>
          {options.map((subGroupBy) => (
            <MenuRadioItem
              key={subGroupBy.key ?? "none"}
              value={subGroupBy.key}
              label={t(subGroupBy.titleTranslationKey)}
            />
          ))}
        </MenuRadioGroup>
      </MenuSubmenuContent>
    </MenuSubmenu>
  );
});
