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
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, TIssueGroupByOptions } from "@plane/types";
// helpers
import { useGroupByOptions } from "../../../utils";
// local imports
import { DisplayFilterCurrentValue } from "./current-value";

type Props = {
  displayFilters: IIssueDisplayFilterOptions | undefined;
  groupByOptions: TIssueGroupByOptions[];
  handleUpdate: (val: TIssueGroupByOptions) => void;
  ignoreGroupedFilters: Partial<TIssueGroupByOptions>[];
};

export const FilterGroupBy = observer(function FilterGroupBy(props: Props) {
  const { displayFilters, groupByOptions, handleUpdate, ignoreGroupedFilters } = props;
  // hooks
  const { t } = useTranslation();

  const selectedGroupBy = displayFilters?.group_by ?? null;
  const selectedSubGroupBy = displayFilters?.sub_group_by ?? null;

  const options = useGroupByOptions(groupByOptions).filter((groupBy) => {
    // a board can't group and sub-group by the same property
    if (displayFilters?.layout === "kanban" && selectedSubGroupBy !== null && groupBy.key === selectedSubGroupBy)
      return false;
    return !ignoreGroupedFilters.includes(groupBy?.key);
  });
  const selectedOption = options.find((option) => option.key === selectedGroupBy);

  return (
    <MenuSubmenu>
      <MenuSubmenuTrigger
        label={t("common.group_by")}
        trailing={
          selectedOption && (
            <DisplayFilterCurrentValue>{t(selectedOption.titleTranslationKey)}</DisplayFilterCurrentValue>
          )
        }
      />
      <MenuSubmenuContent>
        <MenuRadioGroup value={selectedGroupBy} onValueChange={(value: TIssueGroupByOptions) => handleUpdate(value)}>
          {options.map((groupBy) => (
            <MenuRadioItem key={groupBy.key ?? "none"} value={groupBy.key} label={t(groupBy.titleTranslationKey)} />
          ))}
        </MenuRadioGroup>
      </MenuSubmenuContent>
    </MenuSubmenu>
  );
});
